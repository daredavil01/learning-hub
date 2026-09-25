// Where per-user progress lives: localStorage in demo mode, Supabase when signed in.
// Both keep the same flat map of `${kind}:${itemId}` → JSON value, one entry per checkbox, note, story, etc.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type Kind =
  | 'task' | 'resource' | 'checkpoint' | 'deliverable' | 'mock' | 'dsa'
  | 'flashcard' | 'note' | 'star' | 'spend' | 'hours' | 'setting';
export type Items = Record<string, unknown>;
export const itemKey = (kind: Kind, id: string) => `${kind}:${id}`;

export interface Store {
  load(): Promise<Items>;
  set(kind: Kind, id: string, value: unknown): Promise<void>;
  remove(kind: Kind, id: string): Promise<void>;
}

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// null when the env vars are missing (e.g. a fork without Supabase): the app then offers demo mode only.
export const supabase: SupabaseClient | null =
  url && publishableKey ? createClient(url, publishableKey, { auth: { flowType: 'pkce' } }) : null;

const LOCAL_KEY = 'ai60-hub-progress';

export function localStore(): Store {
  const read = (): Items => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
    } catch {
      return {};
    }
  };
  const update = (fn: (items: Items) => void) => {
    const items = read();
    fn(items);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  };
  return {
    load: async () => read(),
    set: async (kind, id, value) => update((items) => { items[itemKey(kind, id)] = value; }),
    remove: async (kind, id) => update((items) => { delete items[itemKey(kind, id)]; }),
  };
}

const PAGE = 1000; // PostgREST's default max rows per request

export function supabaseStore(client: SupabaseClient, userId: string): Store {
  return {
    async load() {
      const items: Items = {};
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await client
          .from('progress')
          .select('kind,item_id,value')
          .order('kind')
          .order('item_id')
          .range(from, from + PAGE - 1);
        if (error) throw error;
        for (const row of data) items[`${row.kind}:${row.item_id}`] = row.value;
        if (data.length < PAGE) return items;
      }
    },
    async set(kind, id, value) {
      const { error } = await client
        .from('progress')
        .upsert({ user_id: userId, kind, item_id: id, value, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    async remove(kind, id) {
      const { error } = await client.from('progress').delete().match({ user_id: userId, kind, item_id: id });
      if (error) throw error;
    },
  };
}
