const markdownIt = require("markdown-it");
const md = new markdownIt({ html: true, breaks: true, linkify: true });

module.exports = function(eleventyConfig) {

  // ---- Static passthrough ----
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/admin");

  // ---- Collections ----

  // Shows — sorted newest year first
  eleventyConfig.addCollection("shows", function(api) {
    return api.getFilteredByGlob("src/shows/*.md")
      .sort((a, b) => (b.data.year || 0) - (a.data.year || 0));
  });

  // Members — sorted alphabetically by name
  eleventyConfig.addCollection("members", function(api) {
    return api.getFilteredByGlob("src/members/*.md")
      .sort((a, b) => (a.data.name || "").localeCompare(b.data.name || ""));
  });

  // News — sorted newest date first
  eleventyConfig.addCollection("news", function(api) {
    return api.getFilteredByGlob("src/news/*.md")
      .sort((a, b) => {
        const da = a.data.date ? new Date(a.data.date) : new Date(0);
        const db = b.data.date ? new Date(b.data.date) : new Date(0);
        return db - da;
      });
  });

  // ---- Filters ----

  // Find the one show with current_show: true
  eleventyConfig.addFilter("currentShow", function(shows) {
    return (shows || []).find(s => s.data.current_show) || null;
  });

  // Human-readable status label
  eleventyConfig.addFilter("statusLabel", function(status) {
    const map = {
      planning:     "Planning",
      auditions:    "Auditions Open",
      rehearsal:    "In Rehearsal",
      performances: "Performances",
      closed:       "Closed"
    };
    return map[status] || status || "";
  });

  // CSS class for status badge
  eleventyConfig.addFilter("statusClass", function(status) {
    const map = {
      planning:     "status-planning",
      auditions:    "status-auditions",
      rehearsal:    "status-rehearsal",
      performances: "status-performances",
      closed:       "status-closed"
    };
    return map[status] || "status-closed";
  });

  // Extract unique years from shows array, newest first
  eleventyConfig.addFilter("uniqueYears", function(shows) {
    const years = [...new Set((shows || []).map(s => s.data.year).filter(Boolean))];
    return years.sort((a, b) => b - a);
  });

  // Format a date value (string or Date) to readable form
  eleventyConfig.addFilter("formatDate", function(dateVal) {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d)) return String(dateVal);
    return d.toLocaleDateString("en-CA", {
      year: "numeric", month: "long", day: "numeric", timeZone: "UTC"
    });
  });

  // Render a markdown string from CMS frontmatter field
  eleventyConfig.addFilter("markdown", function(content) {
    if (!content) return "";
    return md.render(String(content));
  });

  // Limit array to N items
  eleventyConfig.addFilter("limit", function(arr, n) {
    return (arr || []).slice(0, n);
  });

  // Member filter tags from member_type + performer_or_crew fields
  eleventyConfig.addFilter("memberTags", function(member) {
    const tags = [];
    if (member.data.member_type) tags.push(member.data.member_type);
    const poc = member.data.performer_or_crew;
    if (poc === "both") { tags.push("cast"); tags.push("crew"); }
    else if (poc) tags.push(poc);
    return tags.join(" ");
  });

  // Initials from a full name (for avatar placeholder)
  eleventyConfig.addFilter("initials", function(name) {
    if (!name) return "?";
    return name.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
  });

  // Truncate plain text to N chars
  eleventyConfig.addFilter("truncate", function(str, n) {
    if (!str) return "";
    const plain = String(str).replace(/<[^>]+>/g, "");
    return plain.length > n ? plain.slice(0, n).replace(/\s+\S*$/, "") + "…" : plain;
  });

  return {
    dir: {
      input:    "src",
      output:   "_site",
      includes: "_includes",
      data:     "_data"
    },
    templateFormats:       ["njk", "md", "html"],
    htmlTemplateEngine:    "njk",
    markdownTemplateEngine:"njk"
  };
};
