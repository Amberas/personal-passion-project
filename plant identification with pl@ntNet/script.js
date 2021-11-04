'use strict';

const fs = require('fs'); // File System | Node.js
const axios = require('axios'); // HTTP client
const FormData = require('form-data'); // Readable "multipart/form-data" streams

const image_1 = './images/flower.jpeg';
const image_2 = './images/mar.jpeg';
 
(async () => { 
    let form = new FormData();

    form.append('organs', 'flower'); 
    form.append('images', fs.createReadStream(image_1));

    form.append('organs', 'flower');
    form.append('images', fs.createReadStream(image_2)); 


    try {
        const { status, data } = await axios.post( 
            'https://my-api.plantnet.org/v2/identify/all?api-key=2b10iGYVjAsREKxsnYya0zGvHu',
            form, {
            headers: form.getHeaders()
        }
        );
        console.log('status', status); // should be: 200
        console.log('data', require('util').inspect(data, false, null, true)); // should be: read "Step 6" below
        //get name of flower
        //console.log(data.results[0].species.scientificNameWithoutAuthor);
    } catch (error) {
        console.error('error', error);
    }
})();
 

