import { invoke } from '@tauri-apps/api/core'

export async function getAiResponse(messages) {
    try {
        const formattedMessages = messages.map(msg => ({
            role: msg.role || 'user',
            content: msg.content || msg.text || ''
        }));

        console.log('Sending payload to Rust:', formattedMessages);

        const response = await invoke('get_ai_response', { messages: formattedMessages });
        console.log('Received response from Rust:', response);

        return response;
    } catch (error) {
        console.error('Tauri invoke error:', error);
        throw error;
    }
}

export async function indexProject(folderPath) {

}
