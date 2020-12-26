
const begin = "http://www.philosophizethis.org/sitemap.xml";


const stopWords = [ // Words to disclude from word count - taken from microsoft PowerBI-Visuals-WordCloud
    "a", "amazon", "about", "above", "above", "across", "after", "afterwards", "again", "against", "all", "almost", 
    "alone", "along", "already", "also","although","always","am","among", "amongst", "amoungst", "amount",  
    "an", "and", "another", "any","anyhow","anyone","anything","anyway", "anywhere", "are", "around", "as",  
    "at", "back","be","became", "because","become","becomes", "becoming", "been", "before", "beforehand", "behind", 
    "being", "below", "beside", "besides", "between", "beyond", "bill", "both", "bottom","but", "by", "call", 
    "can", "cannot", "cant", "co", "con", "could", "couldnt", "cry", "de", "describe", "detail", "do", "done", 
    "down", "due", "during", "each", "eg", "eight", "either", "eleven","else", "elsewhere", "empty", "enough", "episode", 
    "etc", "even", "ever", "every", "everyone", "everything", "everywhere", "except", "few", "fifteen", "fify", 
    "fill", "find", "fire", "first", "five", "for", "former", "formerly", "forty", "found", "four", "from", 
    "front", "full", "further", "get", "give", "go", "going", "had", "has", "hasnt", "have", "he", "hello", "hence", "her", 
    "here", "hereafter", "hereby", "herein", "hereupon", "hers", "herself", "him", "himself", "his", "how",
    "however", "hundred", "i", "ie", "if", "i'll", "in", "inc", "indeed", "interest", "into", "is", "it", "its", "it's", "itself",
    "keep", "last", "latter", "latterly", "least", "less", "let's", "ltd", "made", "many", "may", "me", "meanwhile", 
    "might", "mill", "mine", "more", "moreover", "most", "mostly", "move", "much", "must", "my", "myself", 
    "name", "namely", "neither", "never", "nevertheless", "next", "nine", "no", "nobody", "none", "noone", 
    "nor", "not", "nothing", "now", "nowhere", "of", "off", "often", "on", "once", "one", "only", "onto", "or", 
    "other", "others", "otherwise", "our", "ours", "ourselves", "out", "over", "own","part", "per", "perhaps", 
    "please", "put", "rather", "re", "same", "see", "seem", "seemed", "seeming", "seems", "serious", "several", 
    "she", "should", "show", "side", "since", "sincere", "six", "sixty", "so", "some", "somehow", "someone", 
    "something", "sometime", "sometimes", "somewhere", "still", "such", "system", "take", "ten", "than", 
    "that", "the", "their", "them", "themselves", "then", "thence", "there", "thereafter", "thereby", "therefore", 
    "therein", "thereupon", "these", "they", "thick", "thin", "third", "this", "those", "though", "three", 
    "through", "throughout", "thru", "thus", "to", "together", "too", "top", "toward", "towards", "transcript", "twelve", 
    "twenty", "two", "un", "under", "until", "up", "upon", "us", "very", "via", "was", "we", "well", "were", 
    "what", "whatever", "when", "whence", "whenever", "where", "whereafter", "whereas", "whereby", "wherein",
    "whereupon", "wherever", "whether", "which", "while", "whither", "who", "whoever", "whole", "whom", "whose", 
    "why", "will", "with", "within", "without", "would", "year", "years", "yet", "you", "your", "you're", "yours", "yourself", "yourselves", "the", "stephen", "west",
    "sponsor", "i'm"
    ];

function query() {
	
	(async () => {
	try {
		const result = await getPageData(begin); // Get the sitemap's XML data
		const resultXML = await parseXML(result); // Parse the JSON into an XML document
		
		const elinks = await getEpisodes(resultXML); // Get URL list for episode links
		const epages = await Promise.all(elinks.map(d => getPageData(d)));
		const edata = await Promise.all(epages.map(d => parseHTML(d)));
		const titles = await getEpisodeTitles(edata); // Create array for all episode titles by parsing HTML

		const locdata = await getTranscripts(resultXML); // Get URL list for transcript links
		
		const episodes = await associateEpisodes(titles, locdata); // Associate each transcript link with a title to store
		await appendTranscripts(episodes); // Create all transcripts in selection box

	} catch(err) {
		console.log(err);
	}
	}) ();
$("#query").attr("disabled", "disabled");
$("#qSubmit").attr("disabled", null);
}
function tQuery() {
	
	(async () => {
	try {
		const selected = await $("#tSelect").find("option:selected").map(function() { return $(this).attr("href"); }).get(); // Get all selected transcripts
		const pages = await Promise.all(selected.map(d => getPageData(d)));
		const tsc = await Promise.all(pages.map(d => parseHTML(d)));
		const transcripts = await Promise.all(tsc.map(d => parseTranscriptData(d)));

		const frequency = await getFrequencies(transcripts);
		const sorted = await sortFrequencies(frequency);
		const stats = await getStats(frequency);
		await appendFrequency(frequency);

		$("#query").attr("disabled", "disabled");

		await createGraph(frequency);	

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
// Gets all transcript titles from XML sitemap
// data MUST be in the form of an XML webpage object
function getTranscripts(data) {
    var links = Array.from(data.getElementsByTagName("loc")).filter(d => d != null && d.textContent.includes("transcript")); // Create an array of each loc element, and filter for all transcripts

    var tsc = []; // Create array of all transcript links
    links.forEach(function(d) {
    	tsc.push(d.textContent);
    });
    return tsc;
}
// Gets all episode links from XML sitemap
// data MUST be in the form of an XML webpage object
function getEpisodes(data) {
    var links = Array.from(data.getElementsByTagName("loc")).filter(d => d != null && !d.textContent.includes("transcript"));

    var tsc = []; // Create array of all episode links
    links.forEach(function(d) {
    	tsc.push(d.textContent);
    });
    return tsc;
}
// Gets all episode titles from an HTML webpage object
// data MUST be in the form of an HTML webpage object
// Returns an array in the format [episode #, title]
function getEpisodeTitles(data) {
	
	var titles = [];
	var ttls = data.map(d => d.find('h1').text().toLowerCase()).filter(d => d.includes("episode"));

	ttls.forEach(function(d) {
		var title = d.split("-");
		var description = title.slice(1).join("").trim();
		if(description.length < 100 && description != "") {
		 titles.push([parseInt(title[0].match(/[1-9]\d*|0\d+/g)[0]), description]);
		}
		
	});
	/*data.forEach(function(d) {
		var ttls = d.find('h1').text().toLowerCase();
		var title = ttls.filter(d => d.includes("episode")).split("-");
		titles.push([title[0].match(/[0-9]/g), title[1]]);
	});*/
	return titles;
}
/*
	Returns an array in the format [Episode Title, Transcript Link], given:
	-an array of titles in the format [Episode #, Episode Title]
	-an array of transcript links
	This is accomplished by:
	-iterating through all transcript links
	-regular expression matching any number 0-9 from the link
	-matching this with a number from the titles array
	-pushing the episode title, link to an array
	-returning the array 
*/
function associateEpisodes(titles, links) {
	console.log(titles);
	console.log("----");
	console.log(links);
	links.forEach(function(d) {
		var num = d.match(/[1-9]\d*|0\d+/g)[0];
		if(titles.contains(num)) {

		}
	});

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
function appendTranscripts(data) {

	d3.select("#tSelect")
		.selectAll("option")
		.data(data)
		.enter().append("option")
		.attr("href", function(d) { return d; })
		.text(function(d) { 
			var spl = d.split("/");
			var ename = spl[spl.length-1];
			return ename; 
		});

}
/*
	Create a frequency box to show descending word frequencies
*/
function appendFrequency(data) {

	var container = d3.select("#transcript");
	var sorted = d3.entries(data).sort(function(f, s) {
		return s.value - f.value;
	});

	sorted.forEach(d => {
		container.append("p")
		.text(d.key + " -> " + d.value);
	});
	/*
	d3.select("#transcript")
		.selectAll("p")
		.data(data)
		.enter().append("p")
		.text(function(d) {
			console.log(Object.entries(d));
			return d; 
		});
	*/
}


/*
	Create a query box for all transcripts
*/

function getFrequencies(data) {
	var words = {};
	data.forEach(function(tsc) {
		tsc.forEach(function(d) {
			var formatted = d
			.replace(/[.]{3}/g, " ")
			.replace(/[\u2026]/g, " ") // remove the triple ellipse unicode symbol smh
			.replace(/[.,\/"#!?$%\^&\*\[\];:{}=\-_~()]/g,'') // remove random formatting
			.replace(/[0-9]/g, ''); // remove all numbers
			var spl = formatted.split(" ").filter(d => !stopWords.includes(d.toLowerCase().trim())).filter(Boolean); // Filter for non-null words and stopwords
			for(var i=0;i<spl.length;i++) {
				var temp = spl[i].replace(/[" ]/g, '').toLowerCase().trim();;
				if(words[temp]) {
					words[temp] = words[temp] + 1;
				}
				else {
					words[temp] = 1;
				}
			}
		});
	});
	var filtered = Object.fromEntries(Object.entries(words).filter(([k,v]) => v>1)); // Return all entries witih more than one occurrance
	return filtered;
}
function sortFrequencies(data) {

}
function getStats(datum) {
	var data = d3.entries(datum);

	var mean = d3.mean(data, d => d.value);
	var median = d3.median(data, d => d.value);
	var stdev = d3.deviation(data, d => d.value);
	var max = d3.max(data, d => d.value);
	var min = d3.min(data, d => d.value);
	console.log("stdev " + stdev);
	console.log("mean " + mean);
	console.log("median " + median);
	console.log("max " + max);
	console.log("min " + min);
	console.log("25th quantile " + d3.quantile(data, .25, d => d.value));
	console.log("50th quantile " + d3.quantile(data, .5, d => d.value));
	console.log("75th quantile " + d3.quantile(data, .75, d => d.value));
} 
function createGraph(datum) {

	var data = d3.entries(datum);


	var sortable = [];
	for(var tmp in data) {
		sortable.push([tmp, data[tmp]]);
	}
	sortable.sort((a,b) => b[1] - a[1]);

	var max = sortable[0][1];


	// set the dimensions and margins of the graph
	var margin = {top: 20, right: 30, bottom: 40, left: 90},
    width = 800 - margin.left - margin.right,
    height = 2000 - margin.top - margin.bottom;

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

	var y = d3.scaleBand()
	  .range([ 0, height ])
	  .domain(data.map(function(d) { return d.key; }))
	  .padding(.1);
	svg.append("g")
	  .call(d3.axisLeft(y))

	svg.append("g")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x))
		.selectAll("text")
			.attr("transform", "translate(-10,0)rotate(-45)")
			.style("text-anchor", "end");



	//Bars
	svg.selectAll("myRect")
	  .data(data)
	  .enter()
	  .append("rect")
	  .attr("x", 0 )
	  .attr("y", function(d) { return y(d.key); })
	  .attr("width", function(d) { return d.value; })
	  .attr("height", y.bandwidth() )
	  .attr("fill", "#69b3a2");
}