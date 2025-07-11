import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
    name: "mcp-OnThisDay",
    version: "1.0.0"
});

const inputSchema = {
    country: z.string().optional().describe("Language code for which the on-this-day events should be checked. For example en(default), de, it, fr etc.")
};

function getCurrentDate(){
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return { month, day };
}

function parseWikiData(rawContent){
    // More aggressive regex to remove style blocks and other unwanted tags
    let cleanContent = rawContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    cleanContent = cleanContent.replace(/<[^>]*>/g, '') 
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') 
    .trim();

    return cleanContent;
}

async function getWikipediaOnThisDay({country}){
    try {
        const { month, day } = getCurrentDate();
        const language = country || 'en';
        
        const apiUrl = `https://api.wikimedia.org/feed/v1/wikipedia/${language}/onthisday/all/${month}/${day}`;

        const response = await fetch(apiUrl);

        if(!response.ok) {
            throw new Error(`Failed to fetch Wikipedia data: ${response.status}`);
        }
        
        const data = await response.json();
        const events = data.events || [];

        let responseText = `Wikipedia "On This Day" Events (${language.toUpperCase()})\n`;
        responseText += `===========================================\n\n`;
        
        if (events.length === 0) {
            responseText += "No events found for the specified date.";
        } else {
            events.forEach((event, index) => {
                responseText += `🗓️ ${event.year}\n`;
                responseText += `${parseWikiData(event.text)}\n`;
                if (index < events.length - 1) {
                    responseText += "\n---\n\n";
                }
            });
        }
        
        return {
            content: [{ 
                type: "text", 
                text: responseText 
            }]
        };
        
    } catch (error) {
        throw new Error(`Error fetching Wikipedia "On This Day": ${error.message}`);
    }
}

server.registerTool("wikipedia-onthisday", {
  title: "Wikipedia On This Day",
  description: "Get historical events that happened on this day from Wikipedia's 'On This Day' feed.",
  inputSchema,
}, getWikipediaOnThisDay);

const transport = new StdioServerTransport();
await server.connect(transport);
