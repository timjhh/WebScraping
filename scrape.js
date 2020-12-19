//https://www.philosophizethis.org/sitemap.xml
//$.ajax({ url: 'http://www.philosophizethis.org/sitemap.xml', success: function(data) { alert(data); } });
//var name = $.get('https://www.freecodecamp.com/' + name, function(response) {  console.log(response);});


const begin = "http://www.philosophizethis.org/sitemap.xml";


(async () => {
	try {
		const result = await getPageData(begin);
		const locdata = await parseLocData(result);
		const transcripts = await locdata.forEach(function(d) {
			return getPageData(d);
		});



		console.log(transcripts);
	} catch(err) {
		console.log(err);
	}
	}) ();


$.when(getPageData(begin)).done(function(data) {
	


});

/*(function getLinks() {
	$.getJSON('https://api.allorigins.win/get?url=' + encodeURIComponent('http://www.philosophizethis.org/sitemap.xml'), function (data) {
        var doc = $.parseXML(data.contents);
        var links = Array.from(doc.getElementsByTagName("loc"));
        links.filter(d => d != null && d.textContent.includes("transcript"));
    });
}*/
function getPageData(link) {
	return $.getJSON('https://api.allorigins.win/get?url=' + encodeURIComponent(link));
}
function parseLocData(data) {
	var doc = $.parseXML(data.contents);
    var links = Array.from(doc.getElementsByTagName("loc")).filter(d => d != null && d.textContent.includes("transcript")); // Create an array of each loc element, and filter for all transcripts

    var tsc = []; // Create array of all transcript links
    links.forEach(function(d) {
    	tsc.push(d.textContent);
    });
    return tsc;
}
function parseTranscriptData(data) {
	var doc = $.parseXML(data.contents);
    var links = Array.from(doc.getElementsByTagName("loc")).filter(d => d != null && d.textContent.includes("transcript")); // Create an array of each loc element, and filter for all transcripts

    var tsc = []; // Create array of all transcript links
    links.forEach(function(d) {
    	tsc.push(d.textContent);
    });
    return tsc;
}