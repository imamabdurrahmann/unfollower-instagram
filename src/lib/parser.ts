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

  // Menggunakan Stack untuk Iterative DFS agar memori lebih efisien dan terhindar dari stack overflow
  const stack = [jsonData];
  
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    if (typeof current === "object") {
      if ("string_list_data" in current) {
        extractFromItem(current);
      } else if (Array.isArray(current)) {
        for (let i = current.length - 1; i >= 0; i--) {
          if (current[i] && typeof current[i] === "object") {
            stack.push(current[i]);
          }
        }
      } else {
        for (const key in current) {
          if (Object.prototype.hasOwnProperty.call(current, key)) {
            const val = current[key];
            if (val && typeof val === "object") {
              stack.push(val);
            }
          }
        }
      }
    }
  }

  return users;
}
