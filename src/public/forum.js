document.addEventListener("DOMContentLoaded", function() {
    async function fetchData() {
        try {
            
            const response = await fetch('/api/posts/1');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log(data)
            populateForum(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

   function populateForum(data) {
        const forumContainer = document.getElementById('forum-topics');

        data.forEach(post => {
            const postDiv = createPostElement(post);
            forumContainer.appendChild(postDiv);
        });
    }
    function createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.classList.add('post');

        const postTitle = document.createElement('h2');
        postTitle.textContent = post.question;

        const postDetails = document.createElement('div');
        postDetails.classList.add('post-details');
        const datetime = (post.date_time).split('T').at(0)
        postDetails.innerHTML = `
        <span>Date: ${datetime}</span>
        <span>Upvotes: ${post.upvotes}</span>
        <span>Downvotes: ${post.downvotes}</span>
        <span>Answers: ${post.answers_count}</span>
        <span>Posted by: ${post.name}</span>
        `;
        // <span>My Post: ${post.my_post ? 'Yes' : 'No'}</span>
        
        const answersContainer = document.createElement('div');
        answersContainer.classList.add('answers');
        
        post.answers.forEach(answer => {
            const answerDiv = document.createElement('div');
            answerDiv.classList.add('answer');
            
            const datetime = (answer.date_time).split('T').at(0)
            answerDiv.innerHTML = `
                <p>${answer.answer}</p>
                <div class="post-details">
                    <span>Date: ${datetime}</span>
                    <span>Upvotes: ${answer.upvotes}</span>
                    <span>Downvotes: ${answer.downvotes}</span>
                    <span>Posted by: ${answer.name}</span>
                    </div>
                    `;
                    // <span>My Post: ${answer.my_post ? 'Yes' : 'No'}</span>
            answersContainer.appendChild(answerDiv);
        });

        postDiv.appendChild(postTitle);
        postDiv.appendChild(postDetails);
        postDiv.appendChild(answersContainer);

        return postDiv;
    }
    fetchData();
});

        