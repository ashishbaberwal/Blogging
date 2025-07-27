
const conf = {

    appwriteEndpoint: String(import.meta.env.VITE_APPWRITE_ENDPOINT),
    appwriteProjectId: String(import.meta.env.VITE_APPWRITE_PROJECT_ID),
    appwriteDataBaseId: String(import.meta.env.VITE_APPWRITE_DATABASE_ID),
    appwriteCollectionId: String(import.meta.env.VITE_APPWRITE_COLLECTION),
    appwriteBucketId: String(import.meta.env.VITE_APPWRITE_BUCKET_ID),
    appwriteApi: String(import.meta.env.VITE_APPWRITE_API), 
    tinyMce: String(import.meta.env.VITE_RTE_APIKEY)

}

export default conf