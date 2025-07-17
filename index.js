import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
    name: "mcp-OnThisDayToday",
    version: "1.0.3"
});

const inputSchema = {
    country: z.string().optional().describe("Language code for which the on-this-day events should be checked. For example en(default), de, it, fr etc."),
    random: z.boolean().optional().describe("If true, a single random event will be returned.")
};

function getCurrentDate(){
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return { month, day };
}

function parseWikiData(rawContent){
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

async function getWikipediaOnThisDayToday({country, random}){
    try {
        const { month, day } = getCurrentDate();
        const language = country || 'en';
        
        const apiUrl = `https://api.wikimedia.org/feed/v1/wikipedia/${language}/onthisday/all/${month}/${day}`;

        const response = await fetch(apiUrl);

        if(!response.ok) {
            throw new Error(`Failed to fetch Wikipedia data: ${response.status}`);
        }
        
        const data = await response.json();
        let events = data.events || [];

        let responseText = `Wikipedia "On This Day" Events from Today (${language.toUpperCase()})\n`;
        responseText += `===========================================\n\n`;
        
        if (events.length === 0) {
            responseText += "No events found for the specified date.";
        } else {
            if (random) {
                const randomIndex = Math.floor(Math.random() * events.length);
                const randomEvent = events[randomIndex];
                responseText += `🗓️ ${randomEvent.year}\n`;
                responseText += `${parseWikiData(randomEvent.text)}\n`;
            } else {
                events.forEach((event, index) => {
                    responseText += `🗓️ ${event.year}\n`;
                    responseText += `${parseWikiData(event.text)}\n`;
                    if (index < events.length - 1) {
                        responseText += "\n---\n\n";
                    }
                });
            }
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

server.registerTool("wikipedia-onthisdaytoday", {
  title: "Wikipedia On This Day Today",
  description: "Get historical events that happened on this day from Wikipedia's 'On This Day' feed.",
  inputSchema,
}, getWikipediaOnThisDayToday);

const transport = new StdioServerTransport();
await server.connect(transport);
