import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { parseString } from "xml2js";

const server = new McpServer({
    name: "mcp-OnThisDay",
    version: "1.0.0"
});

const inputSchema = {
    country: z.string().optional().describe("Language code for which the on-this-day events should be checked. For example en(default), de, it, fr etc.")
};

function parseWikiData(rawContent){
    // This function can still be used to clean up the HTML content from the summary
    return rawContent.replace(/<[^>]*>/g, '') 
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') 
    .trim();
}

async function getWikipediaOnThisDay({country}){
    try {
        let apiUrl;
        if(country && country.trim() !== ''){
            apiUrl = `https://${country}.wikipedia.org/w/api.php?action=featuredfeed&feed=onthisday&feedformat=atom`;
        } else {
            apiUrl = 'https://en.wikipedia.org/w/api.php?action=featuredfeed&feed=onthisday&feedformat=atom';
        }

        const response = await fetch(apiUrl);

        if(!response.ok) {
            throw new Error(`Failed to fetch Wikipedia data: ${response.status}`);
        }
        
        const xmlText = await response.text();

        let entries = [];
        parseString(xmlText, (err, result) => {
            if (err) {
                throw new Error(`Error parsing XML: ${err.message}`);
            }
            const feedEntries = result.feed.entry;
            if (feedEntries) {
                entries = feedEntries.map(entry => ({
                    title: entry.title[0],
                    date: entry.updated[0],
                    content: parseWikiData(entry.summary[0]._)
                }));
            }
        });

        const language = country || 'en';
        let responseText = `Wikipedia "On This Day" Events (${language.toUpperCase()})\n`;
        responseText += `===========================================\n\n`;
        
        if (entries.length === 0) {
            responseText += "No events found for the specified date.";
        } else {
            entries.forEach((entry, index) => {
                responseText += `🗓️ ${entry.title}\n`;
                responseText += `${entry.content}\n`;
                if (index < entries.length - 1) {
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
