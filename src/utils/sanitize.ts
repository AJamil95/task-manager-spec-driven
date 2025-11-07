/**
 * Sanitizer utility class for cleaning and escaping user input
 * Prevents XSS attacks and ensures data integrity
 */
export class Sanitizer {
  /**
   * HTML escape mapping for special characters
   */
  private static readonly HTML_ESCAPE_MAP: Record<string, string> = {
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&#x27;",
  };

  /**
   * Removes leading and trailing whitespace from input string
   * @param input - String to trim
   * @returns Trimmed string
   */
  static trim(input: string): string {
    return input.trim();
  }

  /**
   * Escapes HTML special characters to prevent XSS attacks
   * Converts: < > & " ' to HTML entities
   * @param input - String to escape
   * @returns Escaped string with HTML entities
   */
  static escapeHtml(input: string): string {
    return input.replace(
      /[<>&"']/g,
      (char) => this.HTML_ESCAPE_MAP[char] || char
    );
  }

  /**
   * Sanitizes task input data by trimming and escaping HTML
   * Applies sanitization to title and description fields
   * @param data - Task data with title and optional description
   * @returns Sanitized task data
   */
  static sanitizeTaskInput(data: { title: string; description?: string }): {
    title: string;
    description?: string;
  } {
    const sanitized: { title: string; description?: string } = {
      title: this.escapeHtml(this.trim(data.title)),
    };

    if (data.description !== undefined && data.description !== null) {
      sanitized.description = this.escapeHtml(this.trim(data.description));
    }

    return sanitized;
  }
}
