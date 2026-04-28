import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/__tests__/**/*.test.ts"],
    // graphql-js ships dual CJS/ESM; without inlining, graphql-yoga's
    // transitive copy and the test's direct import end up as separate
    // module realms and `validateSchema(schema)` throws "Cannot use
    // GraphQLSchema from another module or realm". Force a single instance.
    server: {
      deps: {
        // Inline everything so graphql-js is loaded through a single transform
        // pipeline. Without this, graphql-yoga resolves graphql via Node ESM
        // while the test's `import "graphql"` goes through vitest's transformer,
        // creating two GraphQLSchema realms and a "from another module" throw.
        inline: [/.*/],
      },
    },
  },
});
