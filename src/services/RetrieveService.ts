import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { WeaviateStore } from "@langchain/weaviate";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import weaviate, { ApiKey } from "weaviate-ts-client";
import { env } from "../env";

export class RetrieveService {
  private indexName = "Code";

  private embeddingModel = new GoogleGenerativeAIEmbeddings({
    apiKey: env.GOOGLE_API_KEY,
    modelName: "embedding-001",
  });

  private client = weaviate.client({
    scheme: "https",
    host: env.WEAVIATE_URL,
    apiKey: new ApiKey(env.WEAVIATE_API_KEY),
  });

  async getAnswer(query: string) {
    const vectorStore = await WeaviateStore.fromExistingIndex(
      this.embeddingModel,
      {
        client: this.client,
        indexName: this.indexName,
      },
    );

    const retriever = vectorStore.asRetriever();

    return await retriever.invoke(query);
  }

  async addData(data: string) {
    const chunks = await this.docsToChunks([
      new Document({ pageContent: data }),
    ]);
    await WeaviateStore.fromTexts(
      chunks.map((chunk) => chunk.pageContent),
      chunks.map((chunk) => chunk.metadata),
      this.embeddingModel,
      {
        client: this.client,
        indexName: this.indexName,
      },
    );
  }

  private async docsToChunks(docs: Document[]) {
    const splitter = new RecursiveCharacterTextSplitter();
    const docsChunks = await splitter.splitDocuments(docs);
    return docsChunks.map((chunk) => ({
      pageContent: chunk.pageContent,
      metadata: chunk.metadata,
    }));
  }
}
