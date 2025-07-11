#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
    name: "mcp-OnThisDay",
    version: "1.0.0"
});

const inputSchema = {
    country: z.string().optional("Language code for which the on-this-day events should be checked. For example en(default), de, it, fr etc.")

};

function getcurrentDate(){
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function parseWikiData(rawContent){

    let cleanContent = rawContent.replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

    return cleanContent;
}

async function getWikipediaOnThisDay({country}){
    try {
        const targetDate = date || getCurrentDate();

        if(country !== null){
            const apiUrl = `https://${country}.wikipedia.org/w/api.php?action=featuredfeed&feed=onthisday&feedformat=atom`;
        }else{
            const apiUrl = 'https://en.wikipedia.org/w/api.php?action=featuredfeed&feed=onthisday&feedformat=atom';
        }

        const response = await fetch(apiUrl);

        if(!response.ok) {
            throw new Error(`Failed to fetch Wikipedia data: ${response.status}`);
        }
        
        const xmlText = await response.text();

        const entries = [];
        const entryRegex = /<entry>(.*?)<\/entry>/gs;
        let match;

        while ((match = entryRegex.exec(xmlText)) !== null){
            const entryContent = match[1];

            titleMatch = entryContent.match(/<title[^>]*>(.*?)<\/title>/s);
            const title = titleMatch ? titleMatch[1].trim(): 'Unknown';


            const contentMatch = entryContent.match(/<content[^>]*>(.*?)<\/content>/s);
            const rawContent = contentMatch ? contentMatch[1] : '';
            
            const dateMatch = entryContent.match(/<updated>(.*?)<\/updated>/);
            const entryDate = dateMatch ? dateMatch[1] : '';
            
            if (rawContent) {
                const cleanContent = parseWikipediaContent(rawContent);
                
                entries.push({
                title,
                date: entryDate,
                content: cleanContent
                });
            }
        }


        let responseText = `Wikipedia "On This Day" Events (${language.toUpperCase()})`;
        responseText += `===========================================`;
        
        if (entries.length === 0) {
        responseText += "No events found for the specified date.";
        } else {
            entries.forEach((entry, index) => {
                responseText += `📅 ${entry.title}`;
                responseText += `${entry.content}`;
                    if (index < entries.length - 1) {
                responseText += "---";
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

console.error("Wikipedia On This Day MCP Server is running...");

