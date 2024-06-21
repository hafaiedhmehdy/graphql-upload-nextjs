// Import the project using a relative path to enable live debugging of the project's package.
import { GraphQLUpload, type File, uploadProcess } from '../../../../../../index'

import { ApolloServer } from '@apollo/server'
import { NextRequest } from 'next/server'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream'
import { startServerAndCreateNextHandler } from '@as-integrations/next'

// Optional: Use the gql module from Apollo Client for syntax highlighting. 
// This package is already installed for the client side.
import { gql } from '@apollo/client'

// For this example, we define the GraphQL schema and resolvers below.
const typeDefs = gql`
    # Custom scalar type for handling file uploads.
    scalar Upload
    type File {
        encoding: String!
        fileName: String!
        fileSize: Int!
        mimeType: String!
        uri: String!
    }
    type Query {
        default: Boolean!
    }
    type Mutation {
        uploadFile(file: Upload!): File! 
    }
`

const resolvers = {
    Mutation: {
        // This is a simplified example for demonstration purposes only; do not use this code in a production environment.
        uploadFile: async (_parent: void, { file }: { file: Promise<File> }, { ip }: Context) => {
            try {
                const { createReadStream, encoding, fileName, fileSize, mimeType } = await file
                // Use a Promise to handle the asynchronous file saving operation.
                return new Promise((resolve, reject) => {
                    pipeline(
                        createReadStream(),
                        // This example stores the file in the 'public' directory for simplicity, you should NEVER do this.
                        createWriteStream(`./public/${fileName}`),
                        (error) => {
                            if (error) {
                                console.error('File upload pipeline error:', error)
                                reject(new Error('Error during file upload.'))
                            } else {
                                console.log(`${ip} successfully uploaded ${fileName}`)
                                // Resolve the promise with the file details for the GraphQL response.
                                resolve({ encoding, fileName, fileSize, mimeType, uri: `http://localhost:3000/${fileName}` })
                            }
                        }
                    )
                })
            } catch (error) {
                // You should handle any errors that occur during file upload more gracefully.
                console.error('Error handling file upload:', error)
                throw new Error('Failed to handle file upload.')
            }
        }
    },
    Query: {
        default: async () => true
    },
    // Add the custom scalar type for file uploads.
    Upload: GraphQLUpload
}

// Where data and requests meet (and hopefully get along).
const server = new ApolloServer({ resolvers, typeDefs })

interface Context {
    ip: string        // IP address of the client.
    req: NextRequest  // The Next.js request object.
}

// You'll usually want to authenticate users here, but for this example, we'll just get the IP address.
// We centralize the context creation to avoid code duplication.
const contextHandler = async (req: NextRequest, authenticated: string | boolean = false): Promise<Context> => {
    const ip = req.ip || req.headers.get('x-forwarded-for') || ''
    // Since we've already authenticated the user, we skip it here. See the requestHandler for more details.
    if (authenticated) return { ip, req }
    // Default context for normal operations.
    return { ip, req }
}

// Apollo, we have liftoff! 🚀
const handler = startServerAndCreateNextHandler<NextRequest, Context>(server, { context: contextHandler })

// Handle upload requests separately from other GraphQL operations.
// Note: This implementation is basic and needs enhancement for production use.
const requestHandler = async (request: NextRequest) => {
    try {
        // Handle file uploads specifically if the request is multipart/form-data.
        if (request.headers.get('content-type')?.includes('multipart/form-data')) {
            // Authenticate before uploading to prevent abuse.
            // Pass the authenticated user to contextHandler to skip redundant authentication.
            // 'User' is used as a placeholder for the authenticated user.
            const context = await contextHandler(request, 'User')
            return await uploadProcess(
                request,
                context,
                server,
                {
                    // Allow only certain MIME types
                    allowedTypes: ['image/jpeg', 'image/png', 'text/plain'],
                    // Only allow image uploads up to 10MB.
                    maxFileSize: 10 * 1024 * 1024
                }
            )
        }
        // Handle all other requests with the Apollo Server.
        return handler(request)
    } catch (error) {
        // In a production environment, errors should be handled more gracefully.
        console.error('Error in request handling:', error)
        throw new Error('Failed to process request.')
    }
}

// Export request handlers for GET, POST, and OPTIONS methods.
export const GET = requestHandler
export const POST = requestHandler
export const OPTIONS = requestHandler