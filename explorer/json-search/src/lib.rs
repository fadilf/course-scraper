use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Request, RequestInit, RequestMode, Response};
use serde_json::{Map};

#[wasm_bindgen]
extern {
    pub fn alert(s: &str);
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(a: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

static mut SEMESTER_VALUES: Vec<Vec<bool>> = Vec::new();

static mut COURSE_LIST: Vec<String> = Vec::new();
static mut COURSE_TITLE_LIST: Vec<String> = Vec::new();
static mut COURSE_DISTRIBUTION_LIST: Vec<String> = Vec::new();
static mut COURSE_DIVERSITY_LIST: Vec<bool> = Vec::new();
static mut COURSE_CREDITS_LIST: Vec<String> = Vec::new();
static mut COURSE_URL_LIST: Vec<String> = Vec::new();


#[wasm_bindgen]
pub async fn setup(url: String) -> Result<JsValue, JsValue> {
    let mut opts = RequestInit::new();
    opts.method("GET");
    opts.mode(RequestMode::Cors);

    let request = Request::new_with_str_and_init(&url, &opts)?;

    request
        .headers()
        .set("Accept", "application/vnd.github.v3+json")?;

    let window = web_sys::window().unwrap();
    let resp_value = JsFuture::from(window.fetch_with_request(&request)).await?;

    // `resp_value` is a `Response` object.
    assert!(resp_value.is_instance_of::<Response>());
    let resp: Response = resp_value.dyn_into().unwrap();

    // Convert this other `Promise` into a rust `Future`.
    let json: JsValue = JsFuture::from(resp.json()?).await?;

    let data: Map<String, serde_json::Value> = json.into_serde().unwrap();
    let mut semester_ordering: Vec<String> = Vec::new();
    for key in data.keys() {
        unsafe {
            match key.as_str() {
                "Course" => {
                    COURSE_LIST = data.get(key).unwrap().as_array().unwrap().iter().map(|s| {
                        return s.as_str().unwrap().to_string()
                    }).collect()
                },
                "Title" => {
                    COURSE_TITLE_LIST = data.get(key).unwrap().as_array().unwrap().iter().map(|s| {
                        return s.as_str().unwrap().to_string()
                    }).collect()
                },
                "Distribution Group" => {
                    COURSE_DISTRIBUTION_LIST = data.get(key).unwrap().as_array().unwrap().iter().map(|s| {
                        return s.as_str().unwrap().to_string()
                    }).collect()
                },
                "Analyzing Diversity" => {
                    COURSE_DIVERSITY_LIST = data.get(key).unwrap().as_array().unwrap().iter().map(|s| {
                        return s.as_u64().unwrap() == 1
                    }).collect()
                },
                "Credits" => {
                    COURSE_CREDITS_LIST = data.get(key).unwrap().as_array().unwrap().iter().map(|s| {
                        return s.as_str().unwrap().to_string()
                    }).collect()
                },
                "URL" => {
                    COURSE_URL_LIST = data.get(key).unwrap().as_array().unwrap().iter().map(|s| {
                        return s.as_str().unwrap().to_string()
                    }).collect()
                },
                _ => {
                    semester_ordering.push(key.to_string())
                },
            }
        }
    }

    unsafe {
        semester_ordering.sort_by(|a, b| {
            let (season_a, str_year_a) = a.split_once(' ').unwrap();
            let (season_b, str_year_b) = b.split_once(' ').unwrap();
            let year_a: u16 = match season_a {
                "Fall" => str_year_a.parse::<u16>().unwrap() + 1,
                _ => str_year_a.parse().unwrap(),
            };
            let year_b: u16 = match season_b {
                "Fall" => str_year_b.parse::<u16>().unwrap() + 1,
                _ => str_year_b.parse().unwrap(),
            };
            if year_a == year_b {
                season_a.cmp(season_b)
            } else {
                year_a.cmp(&year_b)
            }
        });

        semester_ordering.iter().for_each(|semester| {
            SEMESTER_VALUES.push(data.get(semester).unwrap().as_array().unwrap().iter().map(|s| {
                return s.as_u64().unwrap() == 1
            }).collect());
        });
    }

    let mut course_codes: Vec<String> = Vec::new();
    unsafe {
        for course in COURSE_LIST.iter() {
            let new_code = course.split_once(' ').unwrap().0;
            if !course_codes.contains(&new_code.to_string()) {
                course_codes.push(new_code.to_string());
            }
        }
    }
    course_codes.sort();

    let output_raw = (course_codes, semester_ordering.clone());

    let output = JsValue::from_serde(&output_raw).unwrap();

    return Ok(output);
}

#[wasm_bindgen] 
pub fn render_results(filters: JsValue) -> String {

    let filters: Map<String, serde_json::Value> = filters.into_serde().unwrap();
    let academic_semester = filters.get("Academic Semester").unwrap().as_i64().unwrap();
    let keywords = filters.get("Keywords").unwrap().as_str().unwrap();
    let subject_code = filters.get("Subject Code").unwrap().as_str().unwrap();
    let distribution_group = filters.get("Distribution Group").unwrap().as_str().unwrap();
    let analyzing_diversity = filters.get("Analyzing Diversity").unwrap().as_bool().unwrap();


    // let mut valid_courses: Vec<usize> = Vec::new();
    let mut valid_courses: Vec<(u8, usize)> = unsafe {
        COURSE_LIST.iter().enumerate().filter_map(|(idx, course)|{
            if academic_semester != -1 {
                if !SEMESTER_VALUES[academic_semester as usize][idx] {
                    return None;
                }
            }
            if !subject_code.is_empty() {
                if course.split_once(' ').unwrap().0 != subject_code {
                    return None;
                }
            }
            if !distribution_group.is_empty() {
                if distribution_group != COURSE_DISTRIBUTION_LIST[idx] {
                    return None;
                }
            }
            if analyzing_diversity {
                if !COURSE_DIVERSITY_LIST[idx] {
                    return None;
                }
            }
            if !keywords.is_empty() {
                let mut strength: u8 = 0;
                let searchable_term = format!("{} {}", course, COURSE_TITLE_LIST[idx]);
                keywords.split(' ').for_each(|term|{
                    match searchable_term.find(term) {
                        Some(0) => strength += 2,
                        Some(_p) => strength += 1,
                        None => {},
                    }
                });
                if strength == 0 {
                    return None;
                } else {
                    return Some((strength, idx));
                }
            }

            return Some((0, idx));
    }).collect()};

    if !keywords.is_empty() {
        valid_courses.sort_by(|a,b| b.0.cmp(&a.0));
    }

    return valid_courses.iter().map(|(_strength, idx)|{
        let diversity_msg = match unsafe { COURSE_DIVERSITY_LIST[*idx] } {
            true => "Analyzing Diversity Course",
            _ => "",
        };
        let k = unsafe { format!("
            <tr>
                <th scope='row'>
                    <a href='https://courses.rice.edu{}' target='_blank' class='text-decoration-none'>{}</a>
                </th>
                <td>{}</td>
                <td>{}</td>
                <td>{}</td>
                <td>{}</td>
            </tr>",
            COURSE_URL_LIST[*idx],
            COURSE_LIST[*idx],
            COURSE_TITLE_LIST[*idx],
            COURSE_DISTRIBUTION_LIST[*idx],
            diversity_msg,
            COURSE_CREDITS_LIST[*idx]
        ) };
        return k;
    }).collect::<Vec<String>>().join("");
}