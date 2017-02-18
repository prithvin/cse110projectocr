    function myFunction() {
        console.log('hello');
        var input, filter, table, tr, td, i;
        input = document.getElementById("searchBar");
        filter = input.value.toUpperCase();
        table = document.getElementById("myTable");
        tr = table.getElementsByTagName("tr");
        for (i = 0; i < tr.length; i++) {
            td = tr[i].getElementsByTagName("td")[0];
            if (td) {
                if (td.innerHTML.toUpperCase().indexOf(filter) > -1) {
                    tr[i].style.display = "";
                } else {
                    tr[i].style.display = "none";
                }
            }       
        }
    }

class CourseTableClass {
    constructor (params) {
        this.params = params;
        this.classes = params['Classes'];
        var masterDiv = document.getElementById('course-videos-div');
        this.tableRef = document.getElementById('courses-table').getElementsByTagName('tbody')[0];
        this.addCourses();
    }
    
    addCourses() {
        for(var i = 0; i < this.classes.length; i++) {
            var row = this.tableRef.insertRow(this.tableRef.rows.length);
            var cell = row.insertCell(0);
            row.className = 'table-row';
            row.id = this.classes[i]['classname'];
            var att = document.createAttribute('data-href');
            att.value = this.classes[i]['classpage'];
            row.setAttributeNode(att);
            console.log(row);
            var myClass = document.createTextNode(this.classes[i]['classname'] + ' - ' + this.classes[i]['classqrtr']);
            cell.appendChild(myClass);
            /* Change Window on Click */
            $(document).ready(function($) {
                $(".table-row").click(function() {
                    window.document.location = $(this).data("href");
                });
            });
        }
    }
    
        
        /*
        row.className = 'table-row';
        masterDiv.appendChild(row);
        
        var classes = params['Classes'];
        for (var i = 0; i < videos.length; i++) {
            if (row.childElementCount == 3) {
                row = document.createElement('div');
                row.className = 'row';
                masterDiv.appendChild(row);
            }
            var videoDiv = document.createElement('div');
            videoDiv.className = 'col-md-4';
            row.appendChild(videoDiv);
            
            var img = document.createElement('img');
            img.className = 'img-fluid';
            img.src = videos[i]['PreviewImage'];
            videoDiv.appendChild(img);
            
            var heading = document.createElement('h5');
            heading.align = 'center';
            heading.innerHTML = videos[i]['Date'];
            videoDiv.appendChild(heading);
        */
    
}