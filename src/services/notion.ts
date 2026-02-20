import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/config';
import { NotionPage } from '../types';

WebBrowser.maybeCompleteAuthSession();

const NOTION_TOKEN_KEY = 'north_notion_access_token';
const NOTION_API_BASE = 'https://api.notion.com/v1';

const redirectUri = AuthSession.makeRedirectUri({ scheme: 'north', path: 'notion-callback' });

/**
 * Full OAuth flow: opens in-app browser -> user authorizes -> returns code -> exchanges for token.
 * Uses expo-web-browser's openAuthSessionAsync which catches the redirect automatically.
 */
export const connectNotionOAuth = async (): Promise<boolean> => {
  const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${Config.NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type === 'success') {
    const url = new URL(result.url);
    const code = url.searchParams.get('code');
    if (code) {
      return await exchangeCodeForToken(code);
    }
  }
  return false;
};

const exchangeCodeForToken = async (code: string): Promise<boolean> => {
  try {
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${Config.NOTION_CLIENT_ID}:${Config.NOTION_CLIENT_SECRET}`)}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      await SecureStore.setItemAsync(NOTION_TOKEN_KEY, data.access_token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Notion OAuth error:', error);
    return false;
  }
};

export const getNotionToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(NOTION_TOKEN_KEY);
};

export const isNotionConnected = async (): Promise<boolean> => {
  const token = await getNotionToken();
  return token !== null;
};

export const disconnectNotion = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(NOTION_TOKEN_KEY);
};

export const searchNotionPages = async (query: string = ''): Promise<NotionPage[]> => {
  const token = await getNotionToken();
  if (!token) throw new Error('Notion not connected');

  try {
    const response = await fetch(`${NOTION_API_BASE}/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        query,
        filter: { property: 'object', value: 'page' },
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
        page_size: 20,
      }),
    });

    const data = await response.json();

    return data.results.map((page: any) => ({
      id: page.id,
      title:
        page.properties?.title?.title?.[0]?.plain_text ||
        page.properties?.Name?.title?.[0]?.plain_text ||
        'Untitled',
      url: page.url,
      lastEdited: page.last_edited_time,
    }));
  } catch (error) {
    console.error('Notion search error:', error);
    return [];
  }
};

export const getNotionPageContent = async (pageId: string): Promise<string> => {
  const token = await getNotionToken();
  if (!token) throw new Error('Notion not connected');

  try {
    const response = await fetch(`${NOTION_API_BASE}/blocks/${pageId}/children?page_size=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
      },
    });

    const data = await response.json();
    let content = '';

    for (const block of data.results) {
      const text = extractTextFromBlock(block);
      if (text) content += text + '\n';
    }

    return content.trim();
  } catch (error) {
    console.error('Notion page content error:', error);
    return '';
  }
};

const extractTextFromBlock = (block: any): string => {
  const type = block.type;
  const blockData = block[type];

  if (!blockData?.rich_text) return '';

  const text = blockData.rich_text.map((t: any) => t.plain_text).join('');

  switch (type) {
    case 'heading_1':
      return `# ${text}`;
    case 'heading_2':
      return `## ${text}`;
    case 'heading_3':
      return `### ${text}`;
    case 'bulleted_list_item':
      return `- ${text}`;
    case 'numbered_list_item':
      return `  ${text}`;
    case 'to_do':
      return `${blockData.checked ? '[x]' : '[ ]'} ${text}`;
    case 'quote':
      return `> ${text}`;
    default:
      return text;
  }
};
