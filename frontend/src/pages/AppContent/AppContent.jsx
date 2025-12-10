// src/pages/AppContent.jsx
import React from "react";
import SearchBar from "../../components/SearchBar/SearchBar.jsx";
import FirmCard from "../../components/FirmCard/FirmCard.jsx";
import TagChip from "../../components/TagChip/TagChip.jsx";
import "../../styles/app.css";
import useAllFirms from "../../hooks/useAllFirms.js";

import useSearchInput, { normalize } from "../../hooks/useSearchInput.js";
import useQuickTags from "../../hooks/useQuickTags.js";
import useDynamicFilters from "../../hooks/useDynamicFilters.js";
import useSearchGroups from "../../hooks/useSearchGroups.js";
import useCombinedSearch from "../../hooks/useCombinedSearch.js";
import usePagination from "../../hooks/usePagination.js";

const STATE_STORAGE_KEY = "lir-search-state-v1";

// 0, negativos, NaN, null, undefined => sin ranking (null)
const normalizeRankForSort = (rank) => {
  const n = Number(rank);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n; // 1,2,3,4...
};

const MIN_LOADING_TIME = 300; // 3 segundos mínimos de modal


const AppContent = () => {
  const {
    quickTagsAll,
    quickTagsFiltered,
    setQuickTagsFiltered,
  } = useQuickTags();

  const { query, setQuery, handleTyping } = useSearchInput(
    quickTagsAll,
    setQuickTagsFiltered
  );

  const {
    filterCountries,
    filterRegions,
    countriesForCurrentRegion,
    selectedCountry,
    selectedRegion,
    setSelectedCountry,
    setSelectedRegion,
    applyFilters,
  } = useDynamicFilters();

  const { allFirms, loading: loadingAllFirms } = useAllFirms();

  // Firmas filtradas por región/país (sin agrupar todavía)
  const sidebarFirms = applyFilters(allFirms);

  // 🔹 Agrupar por firma+país y calcular mejor ranking
  const groupedSidebarFirms = React.useMemo(() => {
    const map = new Map();

    sidebarFirms.forEach((f) => {
      const key = `${f.country || ""}||${f.firm || ""}`;
      const normalizedRank = normalizeRankForSort(f.ranked);

      if (!map.has(key)) {
        map.set(key, {
          firm: f.firm,
          country: f.country,
          bestRank: normalizedRank, // null ó número > 0
          areas: [f],
        });
      } else {
        const existing = map.get(key);
        existing.areas.push(f);

        if (normalizedRank === null) {
          // este área no mejora el ranking actual
          return;
        }

        if (
          existing.bestRank === null ||
          normalizedRank < existing.bestRank
        ) {
          existing.bestRank = normalizedRank;
        }
      }
    });

    const arr = Array.from(map.values());

    // Ordenar: 1,2,3,... y al final las sin ranking
    arr.sort((a, b) => {
      const ar = a.bestRank ?? Infinity;
      const br = b.bestRank ?? Infinity;
      if (ar === br) {
        // desempate por nombre de firma
        return (a.firm || "").localeCompare(b.firm || "");
      }
      return ar - br;
    });

    return arr;
  }, [sidebarFirms]);

  const FIRMS_PER_PAGE = 5;
  const [sidebarPage, setSidebarPage] = React.useState(0);

  const hasRegionOrCountry = !!selectedRegion || !!selectedCountry;

  // 🔹 Firma seleccionada desde el sidebar (vista especial en el centro)
  const [selectedSidebarFirm, setSelectedSidebarFirm] = React.useState(null);

  // 🔹 Estado para el modal de loading
  const [isSearching, setIsSearching] = React.useState(false);

  // Reset de página y firma seleccionada al cambiar filtros o lista
  React.useEffect(() => {
    setSidebarPage(0);
    setSelectedSidebarFirm(null);
  }, [selectedRegion, selectedCountry, groupedSidebarFirms.length]);

  const totalSidebarFirmPages = Math.max(
    1,
    Math.ceil(groupedSidebarFirms.length / FIRMS_PER_PAGE)
  );

  const currentSidebarFirmPage = Math.min(
    sidebarPage,
    totalSidebarFirmPages - 1
  );

  const sidebarFirmsToRender = groupedSidebarFirms.slice(
    currentSidebarFirmPage * FIRMS_PER_PAGE,
    currentSidebarFirmPage * FIRMS_PER_PAGE + FIRMS_PER_PAGE
  );

  const shouldShowSidebarPagination =
    hasRegionOrCountry && totalSidebarFirmPages > 1;

  const sidebarFirmNext = () => {
    setSidebarPage((prev) =>
      Math.min(totalSidebarFirmPages - 1, prev + 1)
    );
  };

  const sidebarFirmPrev = () => {
    setSidebarPage((prev) => Math.max(0, prev - 1));
  };

  const {
    searchGroups,
    handleSearchSubmit: rawHandleSearchSubmit,
    handleQuickTagClick: rawHandleQuickTagClick,
    handleRemoveTag: rawHandleRemoveTag,
    handleActiveTagClick: rawHandleActiveTagClick,
  } = useSearchGroups();

  const combinedGroup = useCombinedSearch(searchGroups);

  const TAGS_PER_PAGE = 6;
  const {
    visibleItems: visibleQuickTags,
    totalPages: totalQuickTagPages,
    currentPage: currentQuickTagsPage,
    next: quickTagsNext,
    prev: quickTagsPrev,
    reset: quickTagsReset,
    setPage: setQuickTagsPage,
  } = usePagination(quickTagsFiltered, TAGS_PER_PAGE);

  const [showMoreTags, setShowMoreTags] = React.useState(false);
  const MAX_VISIBLE_TAGS = 6;
  const activeTags = searchGroups.map((g) => g.tag);
  const visibleActiveTags = showMoreTags
    ? activeTags
    : activeTags.slice(0, MAX_VISIBLE_TAGS);

  // Restaurar estado
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STATE_STORAGE_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw);

      if (saved.region) setSelectedRegion(saved.region);
      if (saved.country) setSelectedCountry(saved.country);
      if (saved.query) setQuery(saved.query);

      if (typeof saved.sidebarPage === "number") {
        setSidebarPage(saved.sidebarPage);
      }
      if (typeof saved.quickTagsPage === "number") {
        setQuickTagsPage(saved.quickTagsPage);
      }

      if (Array.isArray(saved.tags) && saved.tags.length) {
        (async () => {
          for (const tag of saved.tags) {
            await rawHandleQuickTagClick(tag);
          }
        })();
      }
    } catch (err) {
      console.error("Error restaurando estado del buscador:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guardar estado
  React.useEffect(() => {
    try {
      const stateToSave = {
        region: selectedRegion,
        country: selectedCountry,
        query,
        tags: searchGroups.map((g) => g.tag),
        sidebarPage,
        quickTagsPage: currentQuickTagsPage,
      };
      sessionStorage.setItem(
        STATE_STORAGE_KEY,
        JSON.stringify(stateToSave)
      );
    } catch (err) {
      console.error("Error guardando estado del buscador:", err);
    }
  }, [
    selectedRegion,
    selectedCountry,
    query,
    searchGroups,
    sidebarPage,
    currentQuickTagsPage,
  ]);

  // 🔹 Wrappers: al buscar o tocar tags limpiamos la firma seleccionada

  const handleSearchSubmit = async (value) => {
    setSelectedSidebarFirm(null);
    setIsSearching(true);
    const start = Date.now();

    try {
      await rawHandleSearchSubmit(value);
    } finally {
      setQuery("");
      setQuickTagsFiltered(quickTagsAll);
      quickTagsReset();

      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;

      if (remaining > 0) {
        setTimeout(() => setIsSearching(false), remaining);
      } else {
        setIsSearching(false);
      }
    }
  };

  const handleQuickTagClick = async (label) => {
    setSelectedSidebarFirm(null);
    await rawHandleQuickTagClick(label);
    quickTagsReset();
  };

  const handleRemoveTag = (tag) => {
    setSelectedSidebarFirm(null);
    rawHandleRemoveTag(tag);
  };

  const handleActiveTagClick = (tag) => {
    setSelectedSidebarFirm(null);
    rawHandleActiveTagClick(tag);
  };

  const combinedFilteredResults = applyFilters(combinedGroup.results || []);
  const hasCombinedSearch =
    combinedGroup.tags && combinedGroup.tags.length >= 2;

  // Firmas que ya aparecen en la búsqueda combinada (para evitar duplicarlas abajo)
  const combinedFirmKeys = React.useMemo(() => {
    return new Set(
      (combinedFilteredResults || []).map((f) =>
        `${f.country || ""}::${f.firm || ""}`
      )
    );
  }, [combinedFilteredResults]);


  return (
    <div className="app-root">
      {isSearching && (
        <div className="search-loading-overlay">
          <div
            className="search-loading-modal"
            role="dialog"
            aria-busy="true"
          >
            <p className="search-loading-title">
              Buscando las mejores firmas…
            </p>
            <p className="search-loading-subtitle">
              Analizando tu busqueda para mejores resultados...
            </p>

            <div className="search-loading-bar-track">
              <div className="search-loading-bar-fill" />
            </div>

            <p className="search-loading-hint">
              Esto puede tomar solo unos segundos
            </p>
          </div>
        </div>
      )}

      <header className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="hero-title">
            Buscador <span> LIR</span>
          </h1>
          <p className="hero-subtitle">Realiza búsquedas inteligentes.</p>

          <SearchBar
            value={query}
            onSearch={handleSearchSubmit}
            onTyping={handleTyping}
          />

          <div className="active-tags-container">
            {visibleActiveTags.map((tag) => (
              <div key={tag} className="active-tag">
                <span onClick={() => handleActiveTagClick(tag)}>{tag}</span>
                <button
                  className="tag-remove"
                  onClick={() => handleRemoveTag(tag)}
                >
                  ✕
                </button>
              </div>
            ))}

            {activeTags.length > MAX_VISIBLE_TAGS && (
              <button
                className="show-more-btn"
                onClick={() => setShowMoreTags((s) => !s)}
              >
                {showMoreTags ? "Mostrar menos" : "Mostrar más"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mientras isSearching sea true, NO se muestran resultados */}
      {!isSearching && (
        <main className="main-content">
          <div className="content-layout">
            {/* SIDEBAR IZQUIERDA — TAGS RÁPIDOS */}
            <aside className="sidebar-column sidebar-left">
              <section className="quick-tags-section sidebar-card">
                <div className="quick-tags-header">
                  <h3>Tags rápidos</h3>

                  {totalQuickTagPages > 1 && (
                    <div className="quick-tags-pagination">
                      <button
                        className="quick-tags-page-btn"
                        onClick={() => quickTagsPrev()}
                        disabled={currentQuickTagsPage === 0}
                      >
                        ‹
                      </button>

                      <span className="quick-tags-page-indicator">
                        {currentQuickTagsPage + 1} / {totalQuickTagPages}
                      </span>

                      <button
                        className="quick-tags-page-btn"
                        onClick={() => quickTagsNext()}
                        disabled={
                          currentQuickTagsPage === totalQuickTagPages - 1
                        }
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>

                <p className="quick-tags-subtitle">
                  Sugerencias basadas en los conceptos más frecuentes para los
                  filtros actuales.
                </p>

                <div className="quick-tags-container">
                  {visibleQuickTags.map((t) => (
                    <TagChip
                      key={t.tag}
                      label={t.tag}
                      count={t.count}
                      onClick={() => handleQuickTagClick(t.tag)}
                    />
                  ))}

                  {visibleQuickTags.length === 0 && (
                    <p className="quick-tags-empty">
                      No hay tags disponibles para esta combinación de filtros.
                    </p>
                  )}
                </div>
              </section>
            </aside>

            {/* COLUMNA CENTRAL */}
            <div className="content-main-column">
              {/* FILTROS */}
              <section className="filters-section">
                <h3>Filtros</h3>
                <div className="filters-row">
                  <select
                    aria-label="select-region"
                    value={selectedRegion}
                    onChange={(e) => {
                      setSelectedRegion(e.target.value);
                      setSelectedCountry("");
                    }}
                  >
                    <option value="">Todas las regiones</option>
                    {filterRegions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="select-country"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                  >
                    <option value="">Todos los países</option>
                    {countriesForCurrentRegion.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              {/* 🔹 VISTA ESPECIAL CUANDO SELECCIONAS UNA FIRMA DEL SIDEBAR */}
              {selectedSidebarFirm ? (
                <section className="results-section">
                  <div className="results-header">
                    <h2>{selectedSidebarFirm.firm}</h2>
                    <span className="results-meta">
                      {selectedSidebarFirm.country || "País no especificado"}
                    </span>
                  </div>

                  <div className="results-grid">
                    <FirmCard
                      firm={selectedSidebarFirm}
                      activeTags={activeTags}
                    />
                  </div>

                  <button
                    type="button"
                    className="return-btn"
                    style={{ marginTop: "1rem" }}
                    onClick={() => setSelectedSidebarFirm(null)}
                  >
                    ← Volver a resultados de búsqueda
                  </button>
                </section>
              ) : (
                <>
                  {/* RESULTADOS COMBINADOS */}
                  {hasCombinedSearch && (
                    <section className="results-section">
                      <div className="results-header">
                        <h2>
                          Firmas que coinciden con todos los conceptos:{" "}
                          {combinedGroup.tags.join(" + ")}
                        </h2>
                        <span className="results-meta">
                          {combinedFilteredResults.length} resultado
                          {combinedFilteredResults.length === 1 ? "" : "s"}
                        </span>
                      </div>

                      {combinedFilteredResults.length === 0 ? (
                        <p className="no-results">
                          No hay ninguna firma que hable de los{" "}
                          {combinedGroup.tags.length} conceptos.
                        </p>
                      ) : (
                        <div className="results-grid">
                          {combinedFilteredResults.map((firm, idx) => (
                            <FirmCard
                              key={`combined-${idx}-${firm.firm}-${firm.country}-${firm.area}`}
                              firm={firm}
                              activeTags={activeTags}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                  {/* RESULTADOS POR CADA TAG */}
                  {searchGroups.map((group) => {
                    let filteredResults = applyFilters(
                      group.results || []
                    );

                    // 2) Si hay búsqueda combinada, excluimos las firmas que ya salieron arriba
                    if (hasCombinedSearch) {
                      filteredResults = filteredResults.filter(
                        (firm) =>
                          !combinedFirmKeys.has(`${firm.country || ""}::${firm.firm || ""}`)
                      );
                    }

                    return (
                      <section
                        key={group.tag}
                        className="results-section"
                      >
                        <div className="results-header">
                          <h2>Búsqueda para “{group.tag}”</h2>
                          <span className="results-meta">
                            {filteredResults.length} resultado
                            {filteredResults.length === 1 ? "" : "s"}
                          </span>
                        </div>

                        {filteredResults.length === 0 ? (
                          <p className="no-results">
                            No hay resultados para esta búsqueda con los
                            filtros actuales.
                          </p>
                        ) : (
                          <div className="results-grid">
                            {filteredResults.map((firm) => (
                              <FirmCard
                                key={`${group.tag}-${firm.id}`}
                                firm={firm}
                                activeTags={activeTags}
                                highlightMatch={
                                  group.isQuickTag ? null : group.tag
                                }
                              />
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </>
              )}
            </div>

            {/* SIDEBAR DERECHA — FIRMAS POR PAÍS */}
            <aside className="sidebar-column sidebar-right">
              <section className="sidebar-card">
                <div className="country-sidebar-header">
                  <h3 className="country-sidebar-card-title">
                    Firmas por país
                  </h3>

                  {shouldShowSidebarPagination && (
                    <div className="country-sidebar-pagination">
                      <button
                        className="country-sidebar-page-btn"
                        onClick={sidebarFirmPrev}
                        disabled={currentSidebarFirmPage === 0}
                      >
                        ‹
                      </button>

                      <span className="country-sidebar-page-indicator">
                        {currentSidebarFirmPage + 1} /{" "}
                        {totalSidebarFirmPages}
                      </span>

                      <button
                        className="country-sidebar-page-btn"
                        onClick={sidebarFirmNext}
                        disabled={
                          currentSidebarFirmPage ===
                          totalSidebarFirmPages - 1
                        }
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>

                {!hasRegionOrCountry && (
                  <p className="country-sidebar-empty">
                    Selecciona una región o un país para ver firmas por país.
                  </p>
                )}

                {hasRegionOrCountry && (
                  <div className="country-cards-container">
                    {sidebarFirmsToRender.length === 0 ? (
                      <p className="country-sidebar-empty">
                        No hay firmas para estos filtros.
                      </p>
                    ) : (
                      sidebarFirmsToRender.map((group) => {
                        const hasRank = group.bestRank !== null;

                        return (
                          <div
                            key={`${group.country}-${group.firm}`}
                            className="country-card"
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              setSelectedSidebarFirm(group.areas[0])
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                setSelectedSidebarFirm(group.areas[0]);
                              }
                            }}

                          >
                            <p className="country-card-country">
                              {group.country}
                            </p>
                            <p className="country-card-firm">
                              {group.firm}
                            </p>
                            <p className="country-card-area">
                              {hasRank
                                ? `Ranking: ${group.bestRank}`
                                : "Sin ranking"}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </section>
            </aside>
          </div>
        </main>
      )}
    </div>
  );
};

export default AppContent;
