/// <reference types="node" />
/// <reference types="node" />
import { GraphQLError, GraphQLScalarType } from 'graphql';
import { type NextRequest, NextResponse } from 'next/server.js';
export interface File {
    createReadStream: () => NodeJS.ReadableStream;
    encoding: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
}
export interface FileStream extends FormDataFile {
    stream: () => Promise<NodeJS.ReadableStream>;
}
export interface FormDataFile {
    lastModified: number;
    name: string;
    size: number;
    type: string;
}
export declare class Upload {
    file?: File;
    promise: Promise<File>;
    reject: (reason?: any) => void;
    resolve: (file: File) => void;
    constructor();
}
export declare const GraphQLUpload: GraphQLScalarType<Promise<File> | GraphQLError, never>;
/**
 * Stream to buffer utility function.
 * @param stream - The readable stream.
 * @returns A promise that resolves to a buffer.
 */
export declare function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer>;
/**
 * Buffer to stream utility function.
 * @param buffer - The buffer.
 * @returns A readable stream.
 */
export declare function bufferToStream(buffer: Buffer): NodeJS.ReadableStream;
/**
 * Sanitize and validate JSON input.
 * @param input - The JSON string to sanitize and validate.
 * @returns The parsed JSON object.
 */
export declare function sanitizeAndValidateJSON(input: string): any;
/**
 * Main function to handle file uploads in a GraphQL request.
 * @param request - The incoming request containing form data.
 * @param context - The context for the server operation.
 * @param server - The GraphQL server instance.
 * @param settings - The settings for file upload, including maxFileSize and allowedTypes.
 * @returns A response containing the result of the GraphQL operation.
 */
export declare function uploadProcess(request: NextRequest, context: any, server: {
    executeOperation: (_: any, __: any) => Promise<any>;
}, settings: {
    allowedTypes: string[];
    maxFileSize: number;
}): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    data: any;
    errors: any;
}> | NextResponse<{
    results: any[];
}> | undefined>;
