'use strict';

function joinUrl(baseUrl, path) {
  const b = String(baseUrl || '').replace(/\/+$/, '');
  const p = String(path || '').startsWith('/') ? String(path) : `/${path}`;
  return `${b}${p}`;
}

function envOr(cfgEnvName, fallbackEnvName) {
  if (cfgEnvName && process.env[cfgEnvName]) return process.env[cfgEnvName];
  if (fallbackEnvName && process.env[fallbackEnvName]) return process.env[fallbackEnvName];
  return undefined;
}

async function chatCompletions({ baseUrl, chatPath, apiKey, model, messages, temperature, responseFormat, extraHeaders }) {
  const url = joinUrl(baseUrl, chatPath);
  const headers = {
    'Content-Type': 'application/json',
    ...(extraHeaders || {}),
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const body = {
    model,
    messages,
  };
  if (temperature != null) body.temperature = temperature;
  if (responseFormat) body.response_format = responseFormat;

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} from ${url}: ${text.slice(0, 500)}`);
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from ${url}: ${text.slice(0, 500)}`);
  }

  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error(`Unexpected response shape from ${url} (missing choices[0].message.content)`);
  }
  return { json, content };
}

module.exports = {
  chatCompletions,
  envOr,
  joinUrl,
};

