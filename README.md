# Course Scraper
A course scraping set of Jupyter notebooks and accompanying data-tools based off Rice University course-data.

## History Viewer
The history viewer can be seen [here](https://fadileledath.com/course-scraper/history/) and is used to see when courses have historically been offered.
## Course Explorer
The course explorer can be seen [here](https://fadileledath.com/course-scraper/explorer/) and acts as an alternative to Rice's course schedule with real-time functionality and less downtime

## The dataset
The dataset is scraped using Python using two separate Jupyter notebooks and collated using a third notebook. It consists of:
- Course catalogs (./catalog/): All courses offered in a single academic year going back to the 2003-2004 academic year in CSV format.
- Course schedules (./schedule/): All courses offered in a Fall/Spring/Summer semester going back to Summer 2004 in CSV format.

## Indexer
Additionally, an indexer notebook exists as an experiment to see if real-time search could be sped up in-browser, though I'm bad at this and I haven't been successful -_-

The collated data is assembled for the past 10 years but can be done going back further by pulling and modifying the "Course Collation Processor.ipynb" file to create your own dataset.
