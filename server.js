// Import the express npm package from the node_modules directory
import express from 'express';

// Import the dom parser npm package from the node_modules directory
import { DOMParser, XMLSerializer } from '@xmldom/xmldom'

// Import the fetchJson function from the ./helpers directory
import fetchJson from './helpers/fetch-json.js';

// Set the base API endpoint
const apiUrl = 'https://redpers.nl/wp-json/wp/v2';

// Create a new express app
const app = express();

// Set ejs as the template engine
app.set('view engine', 'ejs');

// Make working with request data easier
app.use(express.urlencoded({ extended: true }));

// Set the directory for ejs templates
app.set('views', './views');

// Use the 'public' directory for static resources
app.use(express.static('public'));

// Function with domparser
function cleanTextContent(htmlString) {
    // Create a new DOMParser instance
    const parser = new DOMParser();

    // Parse the HTML string into a DOM tree
    const dom = parser.parseFromString(htmlString, 'text/html');

    // Function to traverse the DOM tree and extract text content
    function traverse(node) {
        // Initialize an empty string to hold the text content
        let textContent = '';

        // Check if the current node is a text node
        if (node.nodeType === node.TEXT_NODE) {
            // Append the text content of the current node
            textContent += node.nodeValue;
        }

        // Traverse child nodes recursively
        if (node.childNodes) {
            for (let i = 0; i < node.childNodes.length; i++) {
                textContent += traverse(node.childNodes[i]);
            }
        }

        return textContent;
    }

    // Start traversing the DOM tree from the document node
    let textContent = traverse(dom);

    // Decode HTML entities
    textContent = textContent.replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"')
                            .replace(/&#039;/g, "'")
                            .replace(/&#[0-9]+;/g, (match) => String.fromCharCode(match.substring(2, match.length - 1)))
                            .replace(/\s+/g, ' ');

    return textContent.trim();
}

// GET route for the index page
app.get('/', function (request, response) {
    // Fetch posts from the API
    const categoriesURL = `${apiUrl}/categories?per_page=100`;
    const postsUrl = `${apiUrl}/posts?per_page=100`;
    const usersUrl = `${apiUrl}/users`;

    // Fetch posts and users concurrently
    Promise.all([fetchJson(categoriesURL), fetchJson(postsUrl), fetchJson(usersUrl)])
        .then(([categoriesData, postsData, usersData]) => {
            
            postsData.forEach(postData => {

                postData.title.rendered = cleanTextContent(postData.title.rendered);
                // postData.content.rendered = cleanTextContent(postData.content.rendered);
            });
            // Render index.ejs and pass the fetched data as 'posts' and 'users' variables
            response.render('index', { categories: categoriesData, posts: postsData, users: usersData });
        })
        .catch((error) => {
            // Handle error if fetching data fails
            console.error('Error fetching data:', error);
            response.status(500).send('Error fetching data');
        });
});

// GET route for displaying all posts in a category
app.get('/:categorySlug', function (request, response) {
    const categorySlug = request.params.categorySlug;

    fetchJson(`${apiUrl}/categories?slug=${categorySlug}`)
        .then((categoriesData) => {
            if (categoriesData.length === 0) {
                // If no category found, return 404
                response.status(404).send('Category not found');
                return;
            }

            const categoryId = categoriesData[0].id;

            // Fetch posts from the API based on category id
            fetchJson(`${apiUrl}/posts?categories=${categoryId}`)
                .then((postsData) => {
                    // Render category.ejs and pass the fetched data as 'category' and 'posts' variables
                    response.render('category', { category: categoriesData[0], posts: postsData });
                })
                .catch((error) => {
                    // Handle error if fetching data fails
                    console.error('Error fetching data:', error);
                    response.status(500).send('Error fetching data');
                });
        })
        .catch((error) => {
            // Handle error if fetching data fails
            console.error('Error fetching data:', error);
            response.status(500).send('Error fetching data');
        });
});

// GET route for detail page with request parameters categorySlug and postSlug
app.get('/:categorySlug/:postSlug', function (request, response) {
    const categorySlug = request.params.categorySlug;
    const postSlug = request.params.postSlug;

    fetchJson(`${apiUrl}/categories?slug=${categorySlug}`)
        .then((categoriesData) => {
            if (categoriesData.length === 0) {
                // If no category found, return 404
                response.status(404).send('Category not found');
                return;
            }

            // Fetch the post with the given slug from the API
            fetchJson(`${apiUrl}/posts?slug=${postSlug}`)
                .then((postsData) => {
                    if (postsData.length === 0) {
                        // If no post found, return 404
                        response.status(404).send('Post not found');
                        return;
                    }

                    response.render('post', { post: postsData[0], categories: categoriesData });
                })
                .catch((error) => {
                    // Handle error if fetching data fails
                    console.error('Error fetching data:', error);
                    response.status(404).send('Post not found');
                });
        })
        .catch((error) => {
            // Handle error if fetching data fails
            console.error('Error fetching data:', error);
            response.status(500).send('Error fetching data');
        });
});

// Set the port number for express to listen on
app.set('port', process.env.PORT || 8000);

// Start express and listen on the specified port
app.listen(app.get('port'), function () {
    // Log a message to the console with the port number
    console.log(`Application started on http://localhost:${app.get('port')}`);
});
