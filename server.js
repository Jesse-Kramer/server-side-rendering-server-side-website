// Import the express npm package from the node_modules directory
import express from 'express';

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

// GET route for the index page
app.get('/', function (request, response) {
    // Fetch posts from the API
    const categoriesURL = `${apiUrl}/categories`;
    const postsUrl = `${apiUrl}/posts`;
    const usersUrl = `${apiUrl}/users`;

    // Fetch posts and users concurrently
    Promise.all([fetchJson(categoriesURL), fetchJson(postsUrl), fetchJson(usersUrl)])
        .then(([categoriesData, postsData, usersData]) => {
            // Render index.ejs and pass the fetched data as 'posts' and 'users' variables
            response.render('index', { categories: categoriesData, posts: postsData, users: usersData });
        })
        .catch((error) => {
            // Handle error if fetching data fails
            console.error('Error fetching data:', error);
            response.status(500).send('Error fetching data');
        });
});

// POST route for the index page
app.post('/', function (request, response) {
    // Currently not handling POST data, redirect to the homepage
    response.redirect(303, '/');
});

// GET route for detail page with request parameter id
app.get('/post/:id', function (request, response) {
    // Fetch the post with the given id from the API
    const postId = request.params.id;

    fetchJson(`${apiUrl}/posts/${postId}`)
        .then((apiData) => {
            // Render post.ejs and pass the fetched data as 'post' variable
            response.render('post', { post: apiData });
        })
        .catch((error) => {
            // Handle error if fetching data fails
            console.error('Error fetching data:', error);
            response.status(404).send('Post not found');
        });
});

// Set the port number for express to listen on
app.set('port', process.env.PORT || 8000);

// Start express and listen on the specified port
app.listen(app.get('port'), function () {
    // Log a message to the console with the port number
    console.log(`Application started on http://localhost:${app.get('port')}`);
});
