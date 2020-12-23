//https://www.philosophizethis.org/sitemap.xml
//$.ajax({ url: 'http://www.philosophizethis.org/ + name, function(response) {  console.log(response);});


const begin = "http://www.philosophizethis.org/sitemap.xml";


function query() {
	
	(async () => {
	try {
		const result = await getPageData(begin); // Get the sitemap's XML data
		const resultXML = await parseXML(result); // Parse the JSON into an XML document
		const locdata = await parseLocData(resultXML); // Get URL list for transcript links
		const transcripts = await getPageData(locdata[0]);
		await appendTranscripts(locdata);
		const tsc = await parseHTML(transcripts);
		const transcript = await parseTranscriptData(tsc);
		await appendTranscript(transcript);
		const words = await getFrequency(transcript);

		$("#query").attr("disabled", "disabled");

		await createGraph(words);	

	} catch(err) {
		console.log(err);
	}
	}) ();

}




/*(function getLinks() {
	$.getJSON('https://api.allorigins.win/get?url=' + encodeURIComponent('http://www.philosophizethis.org/sitemap.xml'), function (data) {
sitemap.xml', success: function(data) { alert(data); } });
//var name = $.get('https://www.freecodecamp.com/'        var doc = $.parseXML(data.contents);
        var links = Array.from(doc.getElementsByTagName("loc"));
        links.filter(d => d != null && d.textContent.includes("transcript"));
    });
}*/
function getPageData(link) {
	return $.getJSON('https://api.allorigins.win/get?url=' + encodeURIComponent(link));
}
function parseXML(data) {
	return $.parseXML(data.contents);
}
function parseHTML(data) {
	return $($.parseHTML(data.contents));
}
function parseLocData(data) {
    var links = Array.from(data.getElementsByTagName("loc")).filter(d => d != null && d.textContent.includes("transcript")); // Create an array of each loc element, and filter for all transcripts

    var tsc = []; // Create array of all transcript links
    links.forEach(function(d) {
    	tsc.push(d.textContent);
    });
    return tsc;
}
function parseTranscriptData(data) {
	
	var collection = [];
	var txt = data.find('p').each(function() {
		if($(this).text().length > 50) {
			collection.push($(this).text());
		}
	});
	return collection;
}
/*
	Create a transcript box
*/
function appendTranscript(data) {
	
	d3.select("#transcript")
		.selectAll("p")
		.data(data)
		.enter().append("p")
		.text(function(d) { return d; });
}
/*
	Create a query box for all transcripts
*/
function appendTranscripts(data) {

	d3.select("#tbox")
		.selectAll("a")
		.data(data)
		.enter().append("a")
		.attr("href", function(d) { return d; })
		.text(function(d) { 
			var spl = d.split("/");
			var ename = spl[spl.length-1];
			return ename + " "; });

}

function getFrequency(data) {
	words = [{
		"word": "",
		"frequency": 0
	}];
	data.forEach(function(d) {

		var formatted = d
		.replace(/\u2026/g, ' ') // remove the triple ellipse unicode symbol smh stephen why
		.replace(/[.,\/#"!?"$%\^&\*;:{}=\-_`~()]/g,'') // remove random formatting
		.replace(/[0-9]/g, ''); // remove all numbers
		//var f1 = d.replace(/[.,\/#"!?$%\^&\*;:{}=\-_`~()]/g,'');
		//var f2 = f1.replace(/\.{3}/, " ");
		var spl = formatted.split(" ").filter(Boolean);

		for(var i=0;i<spl.length;i++) {
			var temp = spl[i].toLowerCase();
			if(words[temp]) {
				words[temp] = words[temp] + 1;
			}
			else {
				words[temp] = 1;
			}
		}
	});
	
	return words;
}
function createGraph(data) {

	var sortable = [];
	for(var tmp in data) {
		sortable.push([tmp, words[tmp]]);
	}
	sortable.sort((a,b) => b[1] - a[1]);
	var max = sortable[0][1];


	// set the dimensions and margins of the graph
	var margin = {top: 20, right: 30, bottom: 40, left: 90},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    var svg = d3.select("#graph")
    .append("svg")
    	.attr("width", width + margin.left + margin.right)
    	.attr("height", height + margin.top + margin.bottom)
    .append("g")
    	.attr("transform",
    		"translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleLinear()
	.domain([0, max])
	.range([0, width]);
	svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x))
		.selectAll("text")
			.attr("transform", "translate(-10,0)rotate(-45)")
			.style("text-anchor", "end");

	// Y axis
	var y = d3.scaleBand()
	  .range([ 0, height ])
	  .domain(data.map(function(d) { return d; }))
	  .padding(.1);
	svg.append("g")
	  .call(d3.axisLeft(y))

	//Bars
	svg.selectAll("myRect")
	  .data(datum)
	  .enter()
	  .append("rect")
	  .attr("x", x(0) )
	  .attr("y", function(d) { return y(d); })
	  .attr("width", function(d) { return x(d.values()); })
	  .attr("height", y.bandwidth() )
	  .attr("fill", "#69b3a2")
}