// Illustrations are rendered locally by the frontend; no image service is required.
export const onRequestPost = () =>
  Response.json(
    { error: "This endpoint has been retired. Planet illustrations are rendered locally." },
    { status: 410 },
  )
