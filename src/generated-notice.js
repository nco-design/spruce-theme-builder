const GENERATED_NOTICE =
  "Generated with spruce-theme-builder. Learn more at https://github.com/nco-design/";

function createGeneratedNotice() {
  return { generatedNotice: GENERATED_NOTICE };
}

module.exports = { createGeneratedNotice, GENERATED_NOTICE };
