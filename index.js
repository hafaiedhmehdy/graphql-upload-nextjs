import { GraphQLError, GraphQLScalarType } from 'graphql';
import { NextResponse } from 'next/server.js';
import { fileTypeFromBuffer } from 'file-type';
import { isText } from 'istextorbinary';
export class Upload {
    file;
    promise;
    reject = () => { };
    resolve = () => { };
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = (file) => {
                this.file = file;
                resolve(file);
            };
            this.reject = reject;
        });
        this.promise.catch(() => { });
    }
}
export const GraphQLUpload = new GraphQLScalarType({
    description: 'The Upload scalar type represents a file upload.',
    name: 'Upload',
    parseLiteral(node) { throw new GraphQLError('Upload literal unsupported.', { nodes: node }); },
    parseValue(value) { return value instanceof Upload ? value.promise : new GraphQLError('Upload value invalid.'); },
    serialize() { throw new GraphQLError('Upload serialization unsupported.'); }
});
/**
 * Extract files from form data.
 * @param formData - The form data containing file entries.
 * @returns An object mapping file keys to FormDataFile objects.
 */
async function extractFiles(formData) {
    const files = {};
    for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
            files[key] = value;
        }
    }
    return files;
}
/**
 * Stream to buffer utility function.
 * @param stream - The readable stream.
 * @returns A promise that resolves to a buffer.
 */
export async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}
/**
 * Buffer to stream utility function.
 * @param buffer - The buffer.
 * @returns A readable stream.
 */
export function bufferToStream(buffer) {
    const { Readable } = require('stream');
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}
/**
 * Sanitize and validate JSON input.
 * @param input - The JSON string to sanitize and validate.
 * @returns The parsed JSON object.
 */
export function sanitizeAndValidateJSON(input) {
    try {
        const result = JSON.parse(input);
        if (typeof result !== 'object' || result === null) {
            throw new Error('Invalid JSON structure');
        }
        return result;
    }
    catch (error) {
        console.error('Error parsing JSON:', error);
        throw new Error('Invalid JSON input');
    }
}
/**
 * Process an individual file upload.
 * @param file - The file to be uploaded.
 * @param variableName - The name of the variable associated with the file.
 * @param operations - The GraphQL operations containing the query and variables.
 * @param allowedTypes - The list of allowed MIME types.
 */
async function processUpload(file, variableName, operations, allowedTypes) {
    // Validate file properties
    if (!file.name || !file.size || !file.type) {
        throw new Error('Invalid file properties');
    }
    const stream = await file.stream();
    const buffer = await streamToBuffer(stream);
    const fileType = await fileTypeFromBuffer(buffer);
    // Determine the MIME type
    let mimeType = file.type;
    if (fileType) {
        mimeType = fileType.mime;
    }
    else if (isText(null, buffer)) {
        mimeType = 'text/plain';
    }
    // Check if the file's MIME type is allowed
    if (!allowedTypes.includes(mimeType)) {
        throw new Error(`File type ${mimeType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
    const upload = new Upload();
    upload.resolve({
        fileSize: file.size,
        fileName: file.name,
        mimeType: mimeType,
        encoding: 'binary',
        createReadStream: () => bufferToStream(buffer)
    });
    operations.variables[variableName] = upload;
}
/**
 * Main function to handle file uploads in a GraphQL request.
 * @param request - The incoming request containing form data.
 * @param context - The context for the server operation.
 * @param server - The GraphQL server instance.
 * @param settings - The settings for file upload, including maxFileSize and allowedTypes.
 * @returns A response containing the result of the GraphQL operation.
 */
export async function uploadProcess(request, context, server, settings) {
    try {
        // Extract form data from the request
        const formData = await request.formData();
        const files = await extractFiles(formData);
        // Parse and validate the map and operations from the form data
        const map = sanitizeAndValidateJSON(formData.get('map'));
        const operations = sanitizeAndValidateJSON(formData.get('operations'));
        const uploadPromises = [];
        // Process each file upload based on the map
        for (const fileKey of Object.keys(map)) {
            const file = files[fileKey];
            // Check if the file size exceeds the maximum allowed size
            if (file.size > settings.maxFileSize) {
                return NextResponse.json({ error: `File size is too large. Maximum allowed size is ${settings.maxFileSize / (1024 * 1024)}MB.` });
            }
            const pathSegment = map[fileKey][0];
            const variableName = pathSegment.split('.').slice(-1)[0];
            uploadPromises.push(processUpload(file, variableName, operations, settings.allowedTypes));
        }
        // Wait for all upload promises to resolve
        await Promise.all(uploadPromises);
        // Remove any variables that were not set
        for (const key in operations.variables) {
            if (!operations.variables[key]) {
                delete operations.variables[key];
            }
        }
        // Execute the GraphQL operation
        const response = await server.executeOperation({ query: operations.query, variables: operations.variables }, { contextValue: await context });
        // Return the appropriate response based on the result kind
        if (response.body.kind === 'single') {
            const { data, errors } = response.body.singleResult;
            return NextResponse.json({ data, errors });
        }
        else if (response.body.kind === 'incremental') {
            const { initialResult, subsequentResults } = response.body;
            const results = [initialResult];
            for await (const result of subsequentResults) {
                results.push(result);
            }
            return NextResponse.json({ results });
        }
    }
    catch (error) {
        console.error('Error processing upload:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Error processing upload: ${errorMessage}` });
    }
}
