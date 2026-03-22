/**
 * Physical log sheet (mini page): width × height in inches (portrait 4∶5).
 */
export const SHEET_WIDTH_IN = 5
export const SHEET_HEIGHT_IN = 8

/** Max width for each log sheet on screen only; print size uses SHEET_WIDTH_IN / SHEET_HEIGHT_IN. */
export const SHEET_PREVIEW_MAX_WIDTH_PX = 560

/** `@page` size for browser print (two sheets per row on Letter landscape). */
export const PRINT_PAGE_SIZE_CSS = 'letter landscape'

export const PRINT_PAGE_MARGIN_IN = 0.2

/** Horizontal gap between two sheets on one printed row. */
export const PRINT_SPREAD_GAP_IN = 0.28
