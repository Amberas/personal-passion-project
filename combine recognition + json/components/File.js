import React, { useState, useEffect } from 'react';
import { Button, Image, View, Platform, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Json from '../json/plant.json'


export default function File() {
    const [image, setImage] = useState(null);
    const [dataResponse, setData] = useState(null);
    const [plantSpecs, setPlantSpecs] = useState({name: '', sun:'', water:'' });
    const { name, sun, water} = plantSpecs;

    const testName = "Dracaena trifasciata";


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

    const setSpecs = (value) => {
        setPlantSpecs(value);
    }


    const filterJson = (testName) => {
        const plantSpecsVar = { name: testName, sun: Json.plants[testName].sun, water: Json.plants[testName].water }
        setSpecs(plantSpecsVar);
    }

    const handleCamera = async () => {
        const hasPermissions = await ImagePicker.getCameraPermissionsAsync();

        if (!hasPermissions) {
            return;
        }
        const options = {
            title: 'Choose an Image',
            base64: true
        };

        const img = await ImagePicker.launchCameraAsync(options, response => {
            console.log(response.data);
        });

        setImage(img.uri);

        const data = {
            api_key: "lFEfO77cVUZSlLuxNChfvcdgJwN5bNZhbwCxtrQQfFuHiOKZtP",
            images: [img.base64],
            modifiers: ["crops_fast", "similar_images"],
            plant_language: "en",
            plant_details: ["common_names",
                "url",
                "name_authority",
                "wiki_description",
                "taxonomy",
                "synonyms"]
        };

        fetch('https://api.plant.id/v2/identify', {
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
                filterJson(data.suggestions[0].plant_name);
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    };


    return(
            <View>
                <Button onPress={handleCamera} title="Take a picture" />
                {image && <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}
                {dataResponse && <Text>Name: {dataResponse.suggestions[0].plant_name}</Text>}
                {dataResponse && <Text>Probability: {dataResponse.suggestions[0].probability}</Text>}
                {dataResponse && <Text>sun: {plantSpecs.sun}</Text>}
                {dataResponse && <Text>water: {plantSpecs.water}</Text>}
            </View>
    );
};