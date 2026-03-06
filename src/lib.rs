use serde::Deserialize;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::{spawn_local, JsFuture};
use web_sys::{Document, HtmlAudioElement, HtmlButtonElement, HtmlImageElement, Window};

#[derive(Deserialize)]
struct Manifest {
    sounds: Vec<SoundItem>,
}

#[derive(Deserialize, Clone)]
struct SoundItem {
    name: String,
    file: String,
}

#[wasm_bindgen(start)]
pub fn start() -> Result<(), JsValue> {
    spawn_local(async {
        if let Err(error) = run().await {
            web_sys::console::error_1(&error);
        }
    });

    Ok(())
}

async fn run() -> Result<(), JsValue> {
    let window = get_window()?;
    let document = get_document(&window)?;

    let sounds = load_sounds(&window).await?;
    render_pads(&document, &sounds)?;

    Ok(())
}

async fn load_sounds(window: &Window) -> Result<Vec<SoundItem>, JsValue> {
    let response_value = JsFuture::from(window.fetch_with_str("./assets-manifest.json")).await?;
    let response: web_sys::Response = response_value.dyn_into()?;

    if !response.ok() {
        return Err(JsValue::from_str("Nie mozna wczytac assets-manifest.json"));
    }

    let json_value = JsFuture::from(response.json()?).await?;
    let manifest: Manifest = serde_wasm_bindgen::from_value(json_value)
        .map_err(|_| JsValue::from_str("Niepoprawny format assets-manifest.json"))?;

    if manifest.sounds.is_empty() {
        return Err(JsValue::from_str("Brak plikow audio w folderze assets"));
    }

    Ok(manifest.sounds)
}

fn render_pads(document: &Document, sounds: &[SoundItem]) -> Result<(), JsValue> {
    let pads = document
        .get_element_by_id("pads")
        .ok_or_else(|| JsValue::from_str("Brak elementu #pads"))?;

    pads.set_inner_html("");

    for sound in sounds {
        let button: HtmlButtonElement = document.create_element("button")?.dyn_into()?;
        button.set_class_name("pad");
        button.set_type("button");

        let image: HtmlImageElement = document.create_element("img")?.dyn_into()?;
        image.set_class_name("pad-bg");
        image.set_src("../assets/etykieta.png");
        image.set_alt("");
        let _ = image.set_attribute("decoding", "async");
        let _ = image.set_attribute("loading", "eager");
        button.append_child(&image)?;

        let label = document.create_element("span")?;
        label.set_class_name("pad-label");
        label.set_text_content(Some(&sound.name));
        button.append_child(&label)?;

        let file = sound.file.clone();
        let on_click = Closure::<dyn FnMut(_)>::wrap(Box::new(move |_event: web_sys::Event| {
            if let Ok(audio) = HtmlAudioElement::new_with_src(&file) {
                audio.set_preload("auto");
                audio.set_volume(0.5);
                let _ = audio.play();
            }
        }));

        button.add_event_listener_with_callback("click", on_click.as_ref().unchecked_ref())?;
        on_click.forget();

        pads.append_child(&button)?;
    }

    Ok(())
}

fn get_window() -> Result<Window, JsValue> {
    web_sys::window().ok_or_else(|| JsValue::from_str("Brak obiektu window"))
}

fn get_document(window: &Window) -> Result<Document, JsValue> {
    window
        .document()
        .ok_or_else(|| JsValue::from_str("Brak obiektu document"))
}
