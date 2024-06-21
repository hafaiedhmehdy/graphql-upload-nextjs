# Next.js Example with GraphQL Upload

This example project demonstrates how to integrate GraphQL file uploads into a typical Next.js starter application created with `create-next-app`. The example uses only the `api/graphql/route` to showcase how to use the middleware and Upload scalar in this package to enable GraphQL multipart requests (file uploads via queries and mutations) with Apollo Server in a Next.js integration.

## Getting Started

To get started with this example, clone the repository and navigate to the project directory:

```bash
git clone https://github.com/hafaiedhmehdy/graphql-upload-nextjs.git
cd graphql-upload-nextjs # Enter the project directory
cd examples/example-graphql-upload-nextjs # Navigate to the example
```

Install the dependencies:

```bash
npm install
# or
pnpm install
# or
yarn install
```

Start the development server, which includes the Apollo Studio Sandbox at `/api/graphql`:

```bash
npm run dev
# or
pnpm run dev
# or
yarn dev
```

Your application will run at [http://localhost:3000](http://localhost:3000), where you can access the homepage of the project or go directly to the sandbox at `/api/graphql`.

## Usage

This example demonstrates how to upload files using GraphQL mutations. The file upload functionality is available to test through the Apollo Sandbox, where you can try mutations and add files with the sandbox interface.

To upload a file, select a file using the file input field, set the key to the variable, and click the mutation button. The uploaded file will be stored in the `public` directory, which is not recommended for production.

## Note

This example uses the `graphql-upload-nextjs` package to test and demonstrate its integration with a Next.js/Apollo Server GraphQL setup. The development of `graphql-upload-nextjs` itself is done in the parent folder "graphql-upload-nextjs". Please note: we import the packages through a relative path. If you want to use this Next.js example standalone, update the import from:

```javascript
import { GraphQLUpload, type File, uploadProcess } from '../../../../../../index'
```

to:

```javascript
import { GraphQLUpload, type File, uploadProcess } from 'example-graphql-upload-nextjs'
```

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.