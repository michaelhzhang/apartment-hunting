export async function getListings(url) {
  const resp = await fetch(`${url}?action=getListings`, {
    method: 'GET',
    redirect: 'follow',
  });

  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

  const text = await resp.text();

  if (text.trimStart().startsWith('<')) {
    throw new Error(
      'Apps Script returned an HTML page instead of JSON. ' +
      'Make sure "Who has access" is set to "Anyone" and you\'ve created a new deployment.'
    );
  }

  return JSON.parse(text);
}

export async function updateStatus(url, link, fields) {
  const resp = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'updateStatus', link, fields }),
  });

  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

  const text = await resp.text();

  if (text.trimStart().startsWith('<')) {
    throw new Error(
      'Apps Script returned an HTML page instead of JSON. ' +
      'Make sure "Who has access" is set to "Anyone" and you\'ve created a new deployment.'
    );
  }

  const result = JSON.parse(text);
  if (!result.success) throw new Error(result.error || 'Unknown error from Apps Script');
  return result;
}
