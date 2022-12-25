let $results = $("#results");
let $details = $("#details");

let strengths = null;
let indices = null;
let searchPendingTimeout = null;
let courseBtns = {};

function executeSearch(queryString){
    searchPendingTimeout = null;
    let queryFull = queryString.toUpperCase();
    let query = queryFull.split(" ");
    $("#results li").css("display", "none");

    let match_strengths = {}
    query.forEach(word => {
        if (word.length && (word in strengths)) {
            for (const [courseIdx, courseWordStrength] of Object.entries(strengths[word])) {
                let courseName = indices[courseIdx];
                if (courseName in match_strengths) {
                    match_strengths[courseName] += courseWordStrength;
                } else {
                    match_strengths[courseName] = courseWordStrength;
                }
            }
        }
    });
    let sorted = Object.entries(match_strengths).sort(([,a],[,b]) => a-b).slice(-20).reverse();
    sorted.forEach((match) => {
        let courseTitle = match[0];
        let match_strength = match[1];
        let curBtn = courseBtns[courseTitle];
        $(curBtn).css("display", "inline-block");
        $(curBtn).css("order", -match_strength);
    });
}

function searchPipeline(queryString){
    if (searchPendingTimeout != null) {
        clearTimeout(searchPendingTimeout);
    }
    if (strengths == null) {
        searchPendingTimeout = setTimeout(searchPipeline, 300, queryString);
    } else {
        searchPendingTimeout = setTimeout(executeSearch, 100, queryString);
    }
}

$.getJSON("./collated.json", function(data) {

    let years = {}
    Object.keys(data).forEach(key => {
        let keySplit = key.split(" ");
        if (["Fall", "Spring", "Summer"].includes(keySplit[0])) {
            let season = keySplit[0];
            let year = parseInt(keySplit[1]);
            if (season == "Fall") {
                year += 1;
            }
            let range = (year - 1) + "-" + year;
            if (range in years) {
                years[range].push(season);
            } else {
                years[range] = [season];
            }
        }
    });

    let courses = Object.keys(data.Credits);
    courses.forEach(course => {
        let btn = "<li><button class='res-btn' data-course='" +
            `${course}'>${course}: ${data.Title[course]}</button></li>`;
        $results.append(btn);
    })

    $("#results li").each(function(idx){
        let course = $(this).children("button").attr("data-course");
        courseBtns[course] = this;
    });
    
    let btn = "<li><button disabled class='res-btn no-res' data-course=''>" + 
        "No results</button></li>";
    $results.append(btn);
    
    $(".res-btn").click(function(){
        $(".res-btn.selected").removeClass("selected");
        $(this).addClass("selected");
        let course = $(this).attr("data-course");
        let offerHistory = [];
        Object.keys(years).forEach(range => {

            let newRow = [range];
            let seasons = years[range];
            if (seasons.includes("Fall")) {
                let fallSem = "Fall " + range.split("-")[0];
                newRow.push(data[fallSem][course]);
            } else {
                newRow.push(null);
            }

            if (seasons.includes("Spring")) {
                let springSem = "Spring " + range.split("-")[1];
                newRow.push(data[springSem][course]);
            } else {
                newRow.push(null);
            }

            if (seasons.includes("Summer")) {
                let summerSem = "Summer " + range.split("-")[1];
                newRow.push(data[summerSem][course]);
            } else {
                newRow.push(null);
            }

            offerHistory.push(newRow);
        });

        $details.html(`<p class='course-head'>${course}: ${data.Title[course]}</p>`);
        $details.append(`<div class='glance-details'></div>`);
        $glance = $(".glance-details");
        $glance.append(`<p>Credits: ${data.Credits[course]}</p>`);
        if (data["Distribution Group"][course] == null) {
            $glance.append(`<p>Distribution: None</p>`);
        } else {
            $glance.append(`<p>Distribution: ${data["Distribution Group"][course]}</p>`);
        }
        $glance.append(`<p>More info: <a href='https://courses.rice.edu${data.URL[course]}' target="_blank">Link</a></p>`);
        $details.append("<table class='offer-hist'></table>");
        $table = $(".offer-hist");
        let thead = "<thead><tr>" +
            "<th>Academic Year</th>" +
            "<th>Fall</th>" +
            "<th>Spring</th>" +
            "<th>Summer</th>" +
            "</tr></thead>"
        $table.append(thead);
        let tbody = "<tbody>";
        offerHistory.forEach(row => {
            tbody += "<tr><th>" + row[0] + "</th>";
            row.slice(1).forEach(col => {
                switch(col) {
                    case true:
                        tbody += "<td class='green'>Yes</td>";
                        break;
                    case false:
                        tbody += "<td class='red'>No</td>";
                        break;
                    case null:
                        tbody += "<td class='orange'>?</td>";
                        break;
                }
            });
            tbody += "</tr>";
        });
        tbody += "</tbody>";
        $table.append(tbody);
    });

    $("#course-name").on("input", function(){
        if ($(this).val().trim().length == 0) {
            $("#results li").css("display", "inline-block");
            $("#results li").css("order", 0);
        } else {
            searchPipeline($(this).val());
        }
    });

    $.getJSON("./index.json", function(searchIndex) {
        strengths = searchIndex["strengths"];
        indices = searchIndex["indices"];
    });

});