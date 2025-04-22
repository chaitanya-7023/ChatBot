document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    // API Configuration
    const OPENROUTER_API_KEY = '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';
    const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
    const MODEL = "anthropic/claude-3-haiku";
    
    // Research Collaborator Configuration
    const BOT_NAME = "CollabGPT";
    const BOT_GREETING = {
        role: "assistant",
        content: `👋 Hi! I'm ${BOT_NAME}, your AI research collaboration assistant. 🧠🔍\n\nI can help you with:\n• Finding research collaborators\n• Writing collaboration requests\n• Networking strategies\n• Grant/funding opportunities\n• Managing research partnerships\n\nWhat research collaboration help do you need today?`
    };

    // Conversation History
    let conversationHistory = [
        {
            role: "system",
            content: `You are ${BOT_NAME}, an expert AI assistant for academic research collaboration. Follow these rules:

1. SPECIALIZE in:
   - Connecting researchers across disciplines
   - Writing effective collaboration proposals
   - Finding funding opportunities
   - Managing research partnerships
   - Academic networking strategies

2. RESPONSE FORMAT:
   - Use clear headings (##) for sections
   - Provide bullet points for key information
   - Include relevant emojis (👩‍🔬 🤝 📚)
   - Suggest follow-up questions

3. OFF-TOPIC RESPONSE:
   "${BOT_NAME} here! ✨ I specialize in research collaboration advice. Try asking:
   • 'How to find collaborators in machine learning?'
   • 'What's a good template for a collaboration email?'
   • 'Which grants support interdisciplinary research?'"

4. NEVER:
   - Answer non-research questions
   - Provide medical/legal/financial advice
   - Share unverified information`
        },
        BOT_GREETING
    ];

    // Enhanced Topic Validation
    function isResearchRelated(prompt) {
        const lowerPrompt = prompt.toLowerCase();
        
        // Match research-related keywords
        const researchKeywords = [
            // Collaboration terms
            'collaborat', 'partner', 'team', 'network', 'coauthor', 
            'colleague', 'multidisciplinary', 'interdisciplinary',
            // Research terms
            'research', 'academic', 'paper', 'publication', 'journal',
            'conference', 'symposium', 'workshop', 'study', 'experiment',
            // Finding people
            'find researcher', 'look for professor', 'connect with',
            'who works on', 'expert in',
            // Communication
            'email', 'request', 'proposal', 'outreach', 'contact',
            // Funding
            'grant', 'funding', 'fellowship', 'scholarship', 'sponsor',
            // Management
            'manage', 'coordinate', 'project', 'timeline', 'deadline'
        ];
        
        // Match academic disciplines
        const disciplines = [
            'biology', 'chemistry', 'physics', 'engineering', 'computer science',
            'ai', 'machine learning', 'data science', 'mathematics', 'statistics',
            'psychology', 'neuroscience', 'medicine', 'health', 'social science',
            'economics', 'business', 'humanities', 'arts'
        ];
        
        return (
            researchKeywords.some(keyword => lowerPrompt.includes(keyword)) ||
            disciplines.some(discipline => lowerPrompt.includes(discipline))
        );
    }

    // Send Message Function
    async function sendMessage() {
        const query = userInput.value.trim();
        if (!query) return;
        
        // Add user message to UI immediately
        addMessage(query, 'user');
        userInput.value = '';
        
        // Show typing indicator
        const loadingId = showLoading();
        
        try {
            // Validate topic
            if (!isResearchRelated(query)) {
                removeLoading(loadingId);
                addMessage(
                    `${BOT_NAME} here! ✨ I specialize in research collaboration advice. Try asking:\n` +
                    "• 'How to find collaborators in machine learning?'\n" +
                    "• 'What's a good template for a collaboration email?'\n" +
                    "• 'Which grants support interdisciplinary research?'",
                    'bot'
                );
                return;
            }
            
            // Add to conversation history
            conversationHistory.push({ role: "user", content: query });
            
            // Get AI response
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Research Collaboration Assistant'
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: conversationHistory,
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });
            
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            
            const data = await response.json();
            
            // Process response
            if (data.choices?.[0]?.message) {
                const aiResponse = data.choices[0].message.content;
                
                // Add to conversation history
                conversationHistory.push({ role: "assistant", content: aiResponse });
                
                // Display response
                removeLoading(loadingId);
                addMessage(aiResponse, 'bot');
            } else {
                throw new Error("Unexpected API response format");
            }
        } catch (error) {
            console.error('Error:', error);
            removeLoading(loadingId);
            addMessage(`${BOT_NAME} is having connection issues 🛠️. Please try again shortly!`, 'bot');
        }
    }

    // Helper Functions
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        contentDiv.innerHTML = formatResponseText(text);
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function formatResponseText(text) {
        // Convert markdown-like formatting to HTML
        return text
            .replace(/^##\s+(.+)$/gm, '<h3>$1</h3>') // Headings
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italics
            .replace(/^\s*-\s*(.*)$/gm, '<li>$1</li>') // List items
            .replace(/^\s*\*\s*(.*)$/gm, '<li>$1</li>') // Alternative list items
            .replace(/\n/g, '<br>') // Line breaks
            .replace(/(<li>.*?<\/li>)+/g, matches => `<ul>${matches}</ul>`); // Wrap lists
    }

    function showLoading() {
        const loadingId = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('message', 'bot-message');
        loadingDiv.id = loadingId;
        
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content', 'loading-message');
        contentDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        
        loadingDiv.appendChild(contentDiv);
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return loadingId;
    }

    function removeLoading(id) {
        const loadingElement = document.getElementById(id);
        if (loadingElement) loadingElement.remove();
    }

    // Event Listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendMessage();
    });
});