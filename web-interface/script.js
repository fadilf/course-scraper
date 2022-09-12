var $results = $("#results");
var $details = $("#details");

$.getJSON("./collated.json", function(data) {

    var years = {}
    Object.keys(data).forEach(key => {
        var keySplit = key.split(" ");
        if (["Fall", "Spring", "Summer"].includes(keySplit[0])) {
            var season = keySplit[0];
            var year = parseInt(keySplit[1]);
            if (season == "Fall") {
                year += 1;
            }
            var range = (year - 1) + "-" + year;
            if (range in years) {
                years[range].push(season);
            } else {
                years[range] = [season];
            }
        }
    });

    var courses = Object.keys(data.Credits);
    courses.forEach(course => {
        var btn = "<li><button class='res-btn' data-course='" +
            `${course}'>${course}: ${data.Title[course]}</button></li>`;
        $results.append(btn);
    })

    var courseBtns = [];
    $("#results li").each(function(idx){
        var course = $(this).children("button").attr("data-course");
        courseBtns.push([course + " " + data.Title[course], this]);
    });
    
    var btn = "<li><button disabled class='res-btn no-res' data-course=''>" + 
        "No results</button></li>";
    $results.append(btn);

    
    $("#course-name").on("input", function(){
        var queryFull = $(this).val().toUpperCase();
        var query = queryFull.split(" ");
        $("#results li").css("display", "none");
        var hasMatch = false;
        courseBtns.forEach(btnPair => {
            var similarity = 0;

            // Check baseline similarity
            query.forEach(term => {
                if (btnPair[0].includes(term)) {
                    similarity += 1;
                }
            });

            // Explore ordering accordingly
            if (similarity > 0) {
                if (btnPair[0].includes(queryFull)) {
                    similarity += 1;
                }
                if (btnPair[0].startsWith(query[0])) {
                    similarity += 1;
                    if (btnPair[0].startsWith(queryFull)) {
                        similarity += 1;
                    }
                }
                $(btnPair[1]).css("display", "inline-block");
                $(btnPair[1]).css("order", -similarity);
                hasMatch = true;
            } else {
                $(btnPair[1]).css("display", "none");
            }
        });
    });

    $(".res-btn").click(function(){
        $(".res-btn.selected").removeClass("selected");
        $(this).addClass("selected");
        var course = $(this).attr("data-course");
        var offerHistory = [];
        Object.keys(years).forEach(range => {

            var newRow = [range];
            var seasons = years[range];
            if (seasons.includes("Fall")) {
                var fallSem = "Fall " + range.split("-")[0];
                newRow.push(data[fallSem][course]);
            } else {
                newRow.push(null);
            }

            if (seasons.includes("Spring")) {
                var springSem = "Spring " + range.split("-")[1];
                newRow.push(data[springSem][course]);
            } else {
                newRow.push(null);
            }

            if (seasons.includes("Summer")) {
                var summerSem = "Summer " + range.split("-")[1];
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
        var thead = "<thead><tr>" +
            "<th>Academic Year</th>" +
            "<th>Fall</th>" +
            "<th>Spring</th>" +
            "<th>Summer</th>" +
            "</tr></thead>"
        $table.append(thead);
        var tbody = "<tbody>";
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

});