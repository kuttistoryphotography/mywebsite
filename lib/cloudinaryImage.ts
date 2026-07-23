export function optimizeCloudinaryImage(
  url: string,
  width: number = 1200
) {
  if (!url) return "";

  if (!url.includes("res.cloudinary.com")) {
    return url;
  }

  return url.replace(
    "/upload/",
    `/upload/w_${width},c_limit,f_auto,q_auto/`
  );
}