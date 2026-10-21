// Standalone game output and its legal pages keep the owning project's wiring.
// Pinball's public page uses the ordinary site shell and is intentionally not
// excluded; unrelated prototypes and absent future apps are not inferred here.
export function ownsPageWiring(rel) {
  return ['play/last-bastion', 'privacy/last-bastion', 'go'].some(prefix =>
    rel === prefix || rel.startsWith(prefix + '/'));
}
