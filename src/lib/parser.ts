export interface IgUser {
  username: string;
  href?: string;
  timestamp?: number;
}

export function parseInstagramData(jsonData: any): IgUser[] {
  const users: IgUser[] = [];
  const seenUsernames = new Set<string>();

  // Fungsi helper untuk mengekstrak data
  const extractFromItem = (item: any) => {
    if (item && item.string_list_data && Array.isArray(item.string_list_data) && item.string_list_data.length > 0) {
      const data = item.string_list_data[0];
      
      let username = '';
      if (data && data.value && typeof data.value === 'string') {
        username = data.value;
      } else if (item.title && typeof item.title === 'string') {
        username = item.title;
      }

      if (username) {
        if (!seenUsernames.has(username)) {
          users.push({
            username: username,
            href: data.href,
            timestamp: data.timestamp,
          });
          seenUsernames.add(username);
        }
      }
    }
  };

  // Fungsi rekursif untuk mencari 'string_list_data' di seluruh hierarki JSON
  const traverse = (node: any) => {
    if (!node) return;

    if (typeof node === "object") {
      if ("string_list_data" in node) {
        extractFromItem(node);
      } else if (Array.isArray(node)) {
        node.forEach(traverse);
      } else {
        Object.values(node).forEach(traverse);
      }
    }
  };

  try {
    traverse(jsonData);
  } catch (error) {
    console.error("Error parsing Instagram data:", error);
  }

  return users;
}
