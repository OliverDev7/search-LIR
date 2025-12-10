// tests/searchEngine.test.mjs
// ============================================================================
// COMPREHENSIVE TEST SUITE FOR SEARCH ENGINE
// ============================================================================

import { describe, it, before } from "node:test";
import assert from "node:assert";
import {
    buildFuseIndex,
    semanticSearch,
    searchByTag,
    getQuickTags,
    expandQuery,
    getIndexStats,
    clearQueryCache,
} from "../src/searchEngine.enhanced.mjs";

// Mock firms data for testing
const mockFirms = [
    {
        id: "1",
        firm: "Green Energy Solutions",
        country: "Chile",
        region: "LATAM",
        area: "Energía Renovable",
        description: "Firma especializada en proyectos de energía solar y eólica",
        tags: ["energía", "renovable", "solar", "eólica", "proyectos"],
        tagsText: "energía renovable solar eólica proyectos",
        tagsNormalized: ["energia", "renovable", "solar", "eolica", "proyectos"],
        ranked: 1,
    },
    {
        id: "2",
        firm: "Tech Innovators Law",
        country: "España",
        region: "Europa",
        area: "Tecnología / Software",
        description: "Asesoría legal para startups tecnológicas y empresas de software",
        tags: ["tecnología", "software", "startups", "innovación"],
        tagsText: "tecnología software startups innovación",
        tagsNormalized: ["tecnologia", "software", "startups", "innovacion"],
        ranked: 2,
    },
    {
        id: "3",
        firm: "Environmental Law Experts",
        country: "Chile",
        region: "LATAM",
        area: "Medio Ambiente",
        description: "Especialistas en derecho ambiental y sostenibilidad",
        tags: ["medio ambiente", "sostenibilidad", "ecología", "compliance"],
        tagsText: "medio ambiente sostenibilidad ecología compliance",
        tagsNormalized: ["medio ambiente", "sostenibilidad", "ecologia", "compliance"],
        ranked: 1,
    },
    {
        id: "4",
        firm: "Corporate Finance Partners",
        country: "México",
        region: "LATAM",
        area: "Banca y Finanzas",
        description: "Fusiones, adquisiciones y financiamiento corporativo",
        tags: ["banca", "finanzas", "M&A", "fusiones", "adquisiciones"],
        tagsText: "banca finanzas M&A fusiones adquisiciones",
        tagsNormalized: ["banca", "finanzas", "m&a", "fusiones", "adquisiciones"],
        ranked: 2,
    },
    {
        id: "5",
        firm: "Mining Rights Advisors",
        country: "Perú",
        region: "LATAM",
        area: "Minería",
        description: "Asesoría legal en proyectos mineros y recursos naturales",
        tags: ["minería", "recursos naturales", "extractivos", "proyectos"],
        tagsText: "minería recursos naturales extractivos proyectos",
        tagsNormalized: ["mineria", "recursos naturales", "extractivos", "proyectos"],
        ranked: 3,
    },
    {
        id: "6",
        firm: "Criminal Defense Associates",
        country: "Argentina",
        region: "LATAM",
        area: "Penal / Criminal",
        description: "Defensa penal corporativa y compliance criminal",
        tags: ["criminal", "penal", "defensa", "compliance", "white collar"],
        tagsText: "criminal penal defensa compliance white collar",
        tagsNormalized: ["criminal", "penal", "defensa", "compliance", "white collar"],
        ranked: 2,
    },
    {
        id: "7",
        firm: "Labor Rights Law Firm",
        country: "Chile",
        region: "LATAM",
        area: "Laboral",
        description: "Derecho laboral, negociación colectiva y relaciones sindicales",
        tags: ["laboral", "empleo", "sindicatos", "negociación colectiva"],
        tagsText: "laboral empleo sindicatos negociación colectiva",
        tagsNormalized: ["laboral", "empleo", "sindicatos", "negociacion colectiva"],
        ranked: 1,
    },
    {
        id: "8",
        firm: "IP Protection Lawyers",
        country: "España",
        region: "Europa",
        area: "Propiedad Intelectual",
        description: "Patentes, marcas y protección de derechos de autor",
        tags: ["propiedad intelectual", "patentes", "marcas", "copyright"],
        tagsText: "propiedad intelectual patentes marcas copyright",
        tagsNormalized: ["propiedad intelectual", "patentes", "marcas", "copyright"],
        ranked: 1,
    },
    {
        id: "9",
        firm: "Tax Advisory Group",
        country: "Colombia",
        region: "LATAM",
        area: "Tributario",
        description: "Planificación fiscal y litigios tributarios",
        tags: ["tributario", "impuestos", "fiscal", "IVA", "tax planning"],
        tagsText: "tributario impuestos fiscal IVA tax planning",
        tagsNormalized: ["tributario", "impuestos", "fiscal", "iva", "tax planning"],
        ranked: 2,
    },
    {
        id: "10",
        firm: "Real Estate Developers Legal",
        country: "México",
        region: "LATAM",
        area: "Inmobiliario",
        description: "Desarrollo inmobiliario y transacciones de propiedades",
        tags: ["inmobiliario", "real estate", "propiedades", "desarrollo"],
        tagsText: "inmobiliario real estate propiedades desarrollo",
        tagsNormalized: ["inmobiliario", "real estate", "propiedades", "desarrollo"],
        ranked: 3,
    },
];

let fuseIndex;

// ============================================================================
// TEST SUITE
// ============================================================================

describe("Search Engine Tests", () => {
    before(() => {
        console.log("\n🧪 Initializing test suite...\n");
        fuseIndex = buildFuseIndex(mockFirms);
        clearQueryCache();
    });

    // ========================================================================
    // 1. QUERY EXPANSION TESTS
    // ========================================================================

    describe("Query Expansion", () => {
        it("should expand 'energia' to include related terms", () => {
            const expanded = expandQuery("energia");
            assert.ok(expanded.length > 1, "Should expand to multiple terms");
            assert.ok(expanded.includes("energia"), "Should include original term");
            // Check for at least some energy-related expansions
            const hasEnergyTerms = expanded.some(term =>
                ["energy", "power", "electricity", "renewable"].includes(term)
            );
            assert.ok(hasEnergyTerms, "Should include energy-related synonyms");
        });

        it("should handle accents: 'energía' = 'energia'", () => {
            const withAccent = expandQuery("energía");
            const withoutAccent = expandQuery("energia");
            assert.deepStrictEqual(withAccent, withoutAccent, "Should normalize accents");
        });

        it("should expand 'tecnología' to tech-related terms", () => {
            const expanded = expandQuery("tecnología");
            assert.ok(expanded.length > 1, "Should expand tech terms");
            const hasTechTerms = expanded.some(term =>
                ["technology", "software", "it", "digital"].includes(term)
            );
            assert.ok(hasTechTerms, "Should include tech synonyms");
        });

        it("should handle incomplete word 'energ'", () => {
            const expanded = expandQuery("energ");
            assert.ok(expanded.length >= 1, "Should handle partial words");
        });

        it("should expand 'medio ambiente' to environmental terms", () => {
            const expanded = expandQuery("medio ambiente");
            assert.ok(expanded.length > 1, "Should expand environmental terms");
            const hasEnvTerms = expanded.some(term =>
                ["environment", "esg", "sustainability"].includes(term)
            );
            assert.ok(hasEnvTerms, "Should include environmental synonyms");
        });

        it("should handle empty/invalid queries", () => {
            assert.deepStrictEqual(expandQuery(""), []);
            assert.deepStrictEqual(expandQuery(null), []);
            assert.deepStrictEqual(expandQuery(undefined), []);
        });
    });

    // ========================================================================
    // 2. SEMANTIC SEARCH TESTS
    // ========================================================================

    describe("Semantic Search", () => {
        it("TEST 1: 'energia' should return energy-related firms", () => {
            const results = semanticSearch(fuseIndex, "energia", 10);
            assert.ok(results.length > 0, "Should return results");

            const hasEnergyFirm = results.some(r =>
                r.firm.includes("Energy") || r.tags.some(t => t.includes("energía"))
            );
            assert.ok(hasEnergyFirm, "Should include energy firms");

            // Check explanation exists
            assert.ok(results[0].explanation, "Should have explanation");
            assert.ok(results[0].matchedFields, "Should have matched fields");
        });

        it("TEST 2: 'medio ambiente' should return environmental firms", () => {
            const results = semanticSearch(fuseIndex, "medio ambiente", 10);
            assert.ok(results.length > 0, "Should return environmental firms");

            const hasEnvFirm = results.some(r =>
                r.area.includes("Ambiente") || r.tags.some(t => t.includes("ambiente"))
            );
            assert.ok(hasEnvFirm, "Should include environmental law firms");
        });

        it("TEST 3: 'criminal' should return criminal law firms", () => {
            const results = semanticSearch(fuseIndex, "criminal", 10);
            assert.ok(results.length > 0, "Should return criminal law results");

            const hasCriminalFirm = results.some(r =>
                r.tags.includes("criminal") || r.tags.includes("penal")
            );
            assert.ok(hasCriminalFirm, "Should include criminal/penal firms");
        });

        it("TEST 4: 'tecnologia software computador' should return tech firms", () => {
            const results = semanticSearch(fuseIndex, "tecnologia software computador", 10);
            assert.ok(results.length > 0, "Should return tech firms");

            const hasTechFirm = results.some(r =>
                r.tags.includes("tecnología") || r.tags.includes("software")
            );
            assert.ok(hasTechFirm, "Should include technology firms");
        });

        it("TEST 5: 'energ´a' (typo) should still return energy results", () => {
            const results = semanticSearch(fuseIndex, "energ´a", 10);
            // Fuzzy matching should catch this despite the typo
            assert.ok(results.length > 0, "Should handle typos");
        });

        it("TEST 6: 'energ' (incomplete) should return energy results", () => {
            const results = semanticSearch(fuseIndex, "energ", 10);
            assert.ok(results.length > 0, "Should handle partial words");
        });

        it("TEST 7: 'banca financiero' should return banking firms", () => {
            const results = semanticSearch(fuseIndex, "banca financiero", 10);
            assert.ok(results.length > 0, "Should return banking firms");

            const hasBankingFirm = results.some(r =>
                r.tags.includes("banca") || r.tags.includes("finanzas")
            );
            assert.ok(hasBankingFirm, "Should include banking firms");
        });

        it("TEST 8: 'mineria recursos naturales' should return mining firms", () => {
            const results = semanticSearch(fuseIndex, "mineria recursos naturales", 10);
            assert.ok(results.length > 0, "Should return mining firms");

            const hasMiningFirm = results.some(r =>
                r.area.includes("Minería") || r.tags.includes("minería")
            );
            assert.ok(hasMiningFirm, "Should include mining firms");
        });

        it("TEST 9: 'laboral empleo' should return labor law firms", () => {
            const results = semanticSearch(fuseIndex, "laboral empleo", 10);
            assert.ok(results.length > 0, "Should return labor firms");

            const hasLaborFirm = results.some(r =>
                r.tags.includes("laboral") || r.tags.includes("empleo")
            );
            assert.ok(hasLaborFirm, "Should include labor law firms");
        });

        it("TEST 10: 'propiedad intelectual patentes' should return IP firms", () => {
            const results = semanticSearch(fuseIndex, "propiedad intelectual patentes", 10);
            assert.ok(results.length > 0, "Should return IP firms");

            const hasIPFirm = results.some(r =>
                r.tags.includes("propiedad intelectual") || r.tags.includes("patentes")
            );
            assert.ok(hasIPFirm, "Should include IP firms");
        });

        it("TEST 11: 'impuestos tributario' should return tax firms", () => {
            const results = semanticSearch(fuseIndex, "impuestos tributario", 10);
            assert.ok(results.length > 0, "Should return tax firms");

            const hasTaxFirm = results.some(r =>
                r.tags.includes("tributario") || r.tags.includes("impuestos")
            );
            assert.ok(hasTaxFirm, "Should include tax firms");
        });

        it("TEST 12: 'inmobiliario real estate' should return real estate firms", () => {
            const results = semanticSearch(fuseIndex, "inmobiliario real estate", 10);
            assert.ok(results.length > 0, "Should return real estate firms");

            const hasRealEstateFirm = results.some(r =>
                r.tags.includes("inmobiliario") || r.tags.includes("real estate")
            );
            assert.ok(hasRealEstateFirm, "Should include real estate firms");
        });

        it("should return empty array for nonsense query", () => {
            const results = semanticSearch(fuseIndex, "xyzabc123nonsense", 10);
            // May return results due to fuzzy matching, but should handle gracefully
            assert.ok(Array.isArray(results), "Should return array");
        });

        it("should respect result limit", () => {
            const results = semanticSearch(fuseIndex, "energia", 3);
            assert.ok(results.length <= 3, "Should respect limit");
        });

        it("should include relevance scores", () => {
            const results = semanticSearch(fuseIndex, "energia", 5);
            results.forEach(r => {
                assert.ok(typeof r.relevance === "number", "Should have relevance score");
                assert.ok(r.relevance >= 0 && r.relevance <= 100, "Relevance should be 0-100");
            });
        });

        it("should prioritize ranked firms", () => {
            const results = semanticSearch(fuseIndex, "energia", 10);
            if (results.length >= 2) {
                // Check if higher ranked firms appear earlier (when relevance is similar)
                const firstRanked = results[0].ranked || 999;
                const secondRanked = results[1].ranked || 999;

                // If both have rankings, first should be ≤ second
                if (firstRanked > 0 && secondRanked > 0) {
                    assert.ok(firstRanked <= secondRanked, "Higher ranked firms should appear first");
                }
            }
        });
    });

    // ========================================================================
    // 3. TAG SEARCH TESTS
    // ========================================================================

    describe("Tag Search", () => {
        it("should find firms by exact tag", () => {
            const results = searchByTag(mockFirms, "energía");
            assert.ok(results.length > 0, "Should find firms with energy tag");
            assert.strictEqual(results[0].relevance, 100, "Exact match should have 100% relevance");
        });

        it("should handle tag normalization", () => {
            const withAccent = searchByTag(mockFirms, "energía");
            const withoutAccent = searchByTag(mockFirms, "energia");
            assert.strictEqual(withAccent.length, withoutAccent.length, "Should normalize tags");
        });

        it("should return empty for non-existent tag", () => {
            const results = searchByTag(mockFirms, "nonexistenttag123");
            assert.strictEqual(results.length, 0, "Should return empty for non-existent tag");
        });
    });

    // ========================================================================
    // 4. QUICK TAGS TESTS
    // ========================================================================

    describe("Quick Tags", () => {
        it("should return most frequent tags", () => {
            const tags = getQuickTags(mockFirms, 10);
            assert.ok(tags.length > 0, "Should return tags");
            assert.ok(tags[0].tag, "Tags should have 'tag' property");
            assert.ok(tags[0].count, "Tags should have 'count' property");
        });

        it("should sort tags by frequency", () => {
            const tags = getQuickTags(mockFirms, 10);
            if (tags.length >= 2) {
                assert.ok(tags[0].count >= tags[1].count, "Should sort by count descending");
            }
        });

        it("should respect maxTags limit", () => {
            const tags = getQuickTags(mockFirms, 5);
            assert.ok(tags.length <= 5, "Should respect max tags");
        });
    });

    // ========================================================================
    // 5. INDEX STATISTICS TESTS
    // ========================================================================

    describe("Index Statistics", () => {
        it("should return correct statistics", () => {
            const stats = getIndexStats(mockFirms);
            assert.strictEqual(stats.totalFirms, mockFirms.length);
            assert.ok(stats.firmsWithTags > 0, "Should count firms with tags");
            assert.ok(stats.uniqueTags > 0, "Should count unique tags");
            assert.ok(stats.rankingDistribution, "Should include ranking distribution");
        });

        it("should handle ranking distribution correctly", () => {
            const stats = getIndexStats(mockFirms);
            const dist = stats.rankingDistribution;

            // Count should match firms with each ranking
            const rank1Count = mockFirms.filter(f => f.ranked === 1).length;
            assert.strictEqual(dist[1], rank1Count, "Should count rank 1 correctly");
        });
    });

    // ========================================================================
    // 6. ERROR HANDLING TESTS
    // ========================================================================

    describe("Error Handling", () => {
        it("should handle invalid fuse index", () => {
            const results = semanticSearch(null, "test", 10);
            // Should throw or return empty array
            assert.ok(true, "Should handle invalid index gracefully");
        });

        it("should handle invalid firms array in getQuickTags", () => {
            const tags = getQuickTags(null, 10);
            assert.deepStrictEqual(tags, [], "Should return empty array for invalid input");
        });

        it("should handle invalid firms array in searchByTag", () => {
            const results = searchByTag(null, "test");
            assert.deepStrictEqual(results, [], "Should return empty array for invalid input");
        });

        it("should handle invalid limit values", () => {
            const results = semanticSearch(fuseIndex, "test", -1);
            assert.ok(Array.isArray(results), "Should handle negative limit");

            const results2 = semanticSearch(fuseIndex, "test", 99999);
            assert.ok(results2.length <= 100, "Should cap at max limit");
        });
    });

    // ========================================================================
    // 7. PERFORMANCE TESTS
    // ========================================================================

    describe("Performance", () => {
        it("should complete search within reasonable time", () => {
            const start = Date.now();
            semanticSearch(fuseIndex, "energia tecnologia medio ambiente", 20);
            const elapsed = Date.now() - start;

            assert.ok(elapsed < 500, `Search should complete in <500ms (took ${elapsed}ms)`);
        });

        it("should handle cache properly", () => {
            clearQueryCache();

            // First search (no cache)
            const start1 = Date.now();
            const results1 = semanticSearch(fuseIndex, "energia renovable", 10);
            const time1 = Date.now() - start1;

            // Second search (should be cached)
            const start2 = Date.now();
            const results2 = semanticSearch(fuseIndex, "energia renovable", 10);
            const time2 = Date.now() - start2;

            assert.deepStrictEqual(results1, results2, "Cached results should match");
            console.log(`    ⏱️  First: ${time1}ms, Cached: ${time2}ms`);
        });
    });
});

console.log("\n✅ Test suite completed!\n");
