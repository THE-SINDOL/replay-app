WINDOW_SIZE_ERROR = "h1_shape[3] must be greater than h2_shape[3]"

ERROR_MAPPER = {
    WINDOW_SIZE_ERROR: (
        "Invalid window size.\n\n"
        + "The chosen window size is likely not compatible with this model. Please select a different size and try again."
    ),
}
