import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// CSV parsing utility
export function parseCSV(csvText: string): { data: Record<string, string>[], columns: string[] } {
  if (!csvText.trim()) return { data: [], columns: [] }
  
  // Function to parse CSV with proper quote handling and newline support
  const parseCSVContent = (content: string): string[][] => {
    const rows: string[][] = []
    let currentRow: string[] = []
    let currentField = ''
    let inQuotes = false
    let i = 0
    
    while (i < content.length) {
      const char = content[i]
      
      if (char === '"') {
        if (inQuotes && i + 1 < content.length && content[i + 1] === '"') {
          // Handle escaped quotes
          currentField += '"'
          i += 2
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
          i++
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        currentRow.push(currentField.trim())
        currentField = ''
        i++
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        // End of row (but only if not in quotes)
        if (char === '\r' && i + 1 < content.length && content[i + 1] === '\n') {
          i += 2 // Skip \r\n
        } else {
          i++ // Skip \n or \r
        }
        
        if (currentField.trim() || currentRow.length > 0) {
          currentRow.push(currentField.trim())
          rows.push(currentRow)
          currentRow = []
          currentField = ''
        }
      } else {
        // Regular character (including newlines within quotes)
        currentField += char
        i++
      }
    }
    
    // Add the last field and row
    if (currentField.trim() || currentRow.length > 0) {
      currentRow.push(currentField.trim())
      rows.push(currentRow)
    }
    
    return rows
  }
  
  const rows = parseCSVContent(csvText)
  if (rows.length === 0) return { data: [], columns: [] }
  
  const headers = rows[0]
  const data = rows.slice(1).map(row => {
    const rowData: Record<string, string> = {}
    headers.forEach((header, index) => {
      rowData[header] = row[index] || ''
    })
    return rowData
  })
  
  return { data, columns: headers }
}

// Double curly brace template interpolation
export function interpolateTemplate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match
  })
}
