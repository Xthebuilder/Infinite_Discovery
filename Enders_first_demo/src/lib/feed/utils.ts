import { EXTRA_METADATA } from "./extra-metadata";

/**
 * Finds 8 related items for a given anchor item based on tag overlap.
 * This is a "cheat" implementation for the demo.
 */
export function getRelatedItems(anchorId: string, allLoadedItems: any[]): any[] {
  const anchorMetadata = EXTRA_METADATA[anchorId];
  if (!anchorMetadata) {
    console.warn("⚠️ getRelatedItems: No metadata found for anchor", anchorId);
    return [];
  }

  const anchorTags = new Set(anchorMetadata.tags);
  console.log("🔍 getRelatedItems: Anchor tags for", anchorId, "are", Array.from(anchorTags));

  // Score all items based on tag overlap
  const scored = allLoadedItems
    .filter(item => item.id !== anchorId)
    .map(item => {
      const itemMetadata = EXTRA_METADATA[item.id];
      let score = 0;
      if (itemMetadata) {
        itemMetadata.tags.forEach(tag => {
          if (anchorTags.has(tag)) score += 2;
        });
      }
      return { item, score };
    })
    .filter(s => s.score > 0) // Only items with at least one matching tag
    .sort((a, b) => b.score - a.score);

  console.log(`🔍 getRelatedItems: Found ${scored.length} items with matching tags`);
  return scored.slice(0, 8).map(s => s.item);
}
