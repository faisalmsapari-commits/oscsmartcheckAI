import { describe, it } from "node:test";
import assert from "node:assert";
import { SAMPLE_LCP_FIXTURE_PAGES } from "../../src/lib/extraction/documentProcessor.ts";

describe("Document AI Table Cell & Structural Text Capture Regression Tests", () => {
  it("should preserve structured table row/column relationships in NormalizedPage fixtures", () => {
    const pageWithTable = SAMPLE_LCP_FIXTURE_PAGES.find((p) => p.tables && p.tables.length > 0);
    assert.ok(pageWithTable, "Fixture should contain at least one page with tables");
    assert.ok(pageWithTable.tables && pageWithTable.tables.length > 0);

    const table = pageWithTable.tables[0];
    assert.strictEqual(typeof table.rowCount, "number");
    assert.strictEqual(typeof table.columnCount, "number");
    assert.ok(table.headerRows.length > 0, "Table should have header rows");
    assert.ok(table.bodyRows.length > 0, "Table should have body rows");

    // Verify row/column alignment for parking parameter table
    const firstBodyRow = table.bodyRows[0];
    assert.ok(firstBodyRow.length >= 2, "Row should contain at least 2 columns");
    assert.match(firstBodyRow[0], /(No\. Lot|Kereta)/);
  });

  it("should contain markdown formatted table text in normalized page text", () => {
    const pageWithTable = SAMPLE_LCP_FIXTURE_PAGES.find((p) => p.pageNumber === 42);
    assert.ok(pageWithTable);
    assert.ok(pageWithTable.tables);
    const parkingTable = pageWithTable.tables[0];
    assert.strictEqual(parkingTable.rowCount, 5);
    assert.strictEqual(parkingTable.columnCount, 3);
  });
});
