const supabase = require('./db');

function extractPath(publicUrl, bucket) {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  return idx >= 0 ? publicUrl.substring(idx + marker.length) : null;
}

async function uploadFile(bucket, storagePath, buffer, mimetype) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, { contentType: mimetype, upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return publicUrl;
}

async function deleteFile(bucket, publicUrl) {
  const p = extractPath(publicUrl, bucket);
  if (p) await supabase.storage.from(bucket).remove([p]);
}

module.exports = { uploadFile, deleteFile };
