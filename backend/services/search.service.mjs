import { semanticSearch as runSemantic, getQuickTags as runQuick, searchByTag as runTag } from "../src/searchEngine.js";

export const semanticSearch = (fuse, q, limit) =>
    runSemantic(fuse, q, limit);

export const getQuickTags = (firms, limit) =>
    runQuick(firms, limit);

export const searchByTag = (firms, tag) =>
    runTag(firms, tag);
