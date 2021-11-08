import React, { useState, useEffect } from 'react';
import { Button, Image, View, Platform, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';


export default function File() {
    const [image, setImage] = useState(null);
    const [dataResponse, setData] = useState(null);


    useEffect(() => {
        (async () => {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    alert('Sorry, we need camera roll permissions to make this work!');
                }
            }
        })();
    }, []);

    
    const handleUploade = async() => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.cancelled) {
            setImage(result.uri);
        }

            const data = {
                api_key: "lFEfO77cVUZSlLuxNChfvcdgJwN5bNZhbwCxtrQQfFuHiOKZtP",
                images: [result.uri],
                modifiers: ["crops_fast", "similar_images"],
                plant_language: "en",
                plant_details: ["common_names",
                    "url",
                    "name_authority",
                    "wiki_description",
                    "taxonomy",
                    "synonyms"]
            };

            console.log(data);

           /* fetch('https://api.plant.id/v2/identify', {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                 },
                 body: JSON.stringify(data),
             })
                 .then(response => response.json())
                 .then(data => {
                     console.log('Success:', data);
                     setData(data);
                 })
                 .catch((error) => {
                     console.error('Error:', error);
                 });*/

    }


    return(
            <View>
                <Button onPress={handleUploade} title="Upload image"/>
                {image && <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}
                {dataResponse && <Text>Name: {dataResponse.suggestions[0].plant_name}</Text>}
                {dataResponse && <Text>Probability: {dataResponse.suggestions[0].probability}</Text>}
                
            </View>
    );
};