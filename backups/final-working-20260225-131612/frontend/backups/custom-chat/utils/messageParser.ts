export const parseMessage = (data: string): string => {
  try {
    // Handle both base64 and regular strings
    if (data.includes('=') || /^[A-Za-z0-9+/]+$/.test(data)) {
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const decoder = new TextDecoder();
      return decoder.decode(bytes);
    }
    return data;
  } catch (e) {
    console.error('Failed to parse message:', e);
    return data;
  }
};

export const encryptMessage = (text: string): string => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  return btoa(String.fromCharCode(...new Uint8Array(data)));
};
