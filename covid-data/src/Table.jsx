import { useState, useEffect, useMemo } from 'react';
import { useTable, usePagination, useSortBy, useGlobalFilter} from 'react-table';
import DatePicker from "react-datepicker";
import { FilterByCountry } from './FilterByCountry';
import { Tabs, Tab, Box, Typography } from '@mui/material/'
import Chart from './Chart';
import "react-datepicker/dist/react-datepicker.css";
import './index.css'

function Table(){

    const [data, setData] = useState([]);
    const [dataToRender, setDataToRender] = useState([]);
    const [dataBeforeCustomFilter, setdataBeforeCustomFilter] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [paramToFilterBy, setParamToFilterBy] = useState("");
    const [paramToFilterByMax, setParamToFilterByMax] = useState("");
    const [paramToFilterByMin, setParamToFilterByMin] = useState("");
    const [tabValue, setTabValue] = useState(0);
    const [dataForChart, setDataForChart] = useState([]);

    useEffect(() => {
        async function fetchAndProcessData(){
            setLoading(true);
            try{
                const dataToProcess = await fetchData();
                const processedDataArray = filterDataByCountry(dataToProcess);
                setData(processedDataArray); 
                setDataToRender(defaultFilterData(processedDataArray));
            }
            catch (error){
                console.error("Error fetching or processing data");
            }
            finally {
                setLoading(false);
            }
        }  

        fetchAndProcessData();
    }, []);

    async function fetchData() {
        let result = [];
        try {
            const response = await fetch("https://opendata.ecdc.europa.eu/covid19/casedistribution/json/");
            const fetchedData = await response.json();
            result = fetchedData.records.map(record => ({
                date: new Date(record.year, record.month - 1, record.day),
                cases: record.cases,
                deaths: record.deaths,
                country: record.countriesAndTerritories,
                population: record.popData2019
            })); 
        }
        catch (error){
            console.error("Error fetching data", error);
        }
        return result;}
      
    function filterDataByCountry(data){
        const groupedData = {};
        data.forEach( record => {
            const country = record.country;
            if (!groupedData[country]) {
                groupedData[country] = [];
            }
                groupedData[country].push(record);
        });
        const {Cases_on_an_international_conveyance_Japan, ...result} = groupedData;
        setDataForChart(result);
        return result;
    }

    function calculateLatestDate(data){
        let latestDate = new Date(-8640000000000000);
        Object.values(data).forEach(country => {
            country.forEach(record => {
                const currentDate = record.date;
                if (currentDate > latestDate){
                    latestDate = currentDate;
                }
            });
        });

        return latestDate;
    }

    function calculateEarliestDate(data){
        let earliestDate = new Date(8640000000000000);
        Object.values(data).forEach(country => {
            country.forEach(record => {
                const currentDate = record.date;
                if (currentDate < earliestDate){
                    earliestDate = currentDate;
                }
            });
        });

        return earliestDate;
    }

    function defaultFilterData(data){
        let processedData = [];
        Object.entries(data).forEach(([country, array]) => {
            processedData[country] = array.reduce((acc, item) => {
                acc.totalCases += item.cases;
                acc.totalDeaths += item.deaths;
                acc.population = item.population;
                return acc;
            }, {totalCases: 0, totalDeaths: 0, population: 0});
            processedData[country].casesPerPopulation = (processedData[country].totalCases / processedData[country].population * 1000).toFixed(2);
            processedData[country].deathsPerPopulation = (processedData[country].totalDeaths / processedData[country].population * 1000).toFixed(2);
            processedData[country].deaths = processedData[country].totalDeaths;
            processedData[country].cases = processedData[country].totalCases;
        });
        const formattedData = Object.entries(processedData).map(([country, values]) =>({
            country,
            ...values,
        }));
        setEndDate(calculateLatestDate(data));
        setStartDate(calculateEarliestDate(data));
        return formattedData;
    }

   function filterDataByDate(startDate, endDate){
    let filteredByDateData = {};
    let processedData = {};
    let totalCasesAndDeaths = {};

    Object.keys(data).forEach(country => {
        filteredByDateData[country] = data[country].filter(record =>
            {return record.date >= startDate && record.date <= endDate})
    });

    setDataForChart(filteredByDateData);

    Object.entries(data).forEach(([country, array]) => {
        totalCasesAndDeaths[country] = array.reduce((acc, item) => {
            acc.totalCases += item.cases;
            acc.totalDeaths += item.deaths;
            return acc;
        }, {totalCases: 0, totalDeaths: 0});
    });

    Object.entries(filteredByDateData).forEach(([country, array]) => {
        processedData[country] = array.reduce((acc, item) => {
            acc.cases += item.cases;
            acc.deaths += item.deaths;
            acc.population = item.population;
            return acc;
        }, {cases: 0, deaths: 0, population: 0});
        processedData[country].casesPerPopulation = (processedData[country].cases / processedData[country].population * 1000).toFixed(2);
        processedData[country].deathsPerPopulation = (processedData[country].deaths / processedData[country].population * 1000).toFixed(2);
    });

    const mergedData = Object.entries(processedData).reduce((acc, [country, value]) => {
        acc[country] = {...value, ...totalCasesAndDeaths[country]};
        return acc;
    }, {});

    const result = Object.entries(mergedData).map(([country, values]) =>({
        country,
        ...values,
    }));

    setDataToRender(result);
   }

    function filterDataByParameter(parameter, minValue, maxValue){
        if (dataBeforeCustomFilter.length === 0){
            setdataBeforeCustomFilter(dataToRender);
        }
        let result = {};
        if(dataBeforeCustomFilter.length === 0){
            result = dataToRender.filter (country => {
                return country[parameter] >= minValue && country[parameter] <= maxValue});
        }
        else {
            result = dataBeforeCustomFilter.filter (country => {
                return country[parameter] >= minValue && country[parameter] <= maxValue});
        }
       
        setDataToRender(result);
    }

    function handleStartDateChange(date){
        setStartDate(date);
        filterDataByDate(date, endDate);
    } 

    function handleEndDateChange(date){
        setEndDate(date);
        filterDataByDate(startDate, date);
    } 

    function handleFilterParameterChange(event){
        setParamToFilterBy(event.target.value);
        if (paramToFilterByMax !== ""){
            if (paramToFilterByMin !== ""){
                filterDataByParameter(event.target.value, paramToFilterByMin, paramToFilterByMax);
            } else {
                filterDataByParameter(event.target.value, 0, paramToFilterByMax);
            }    
        } else if (paramToFilterByMin !== "")
        {
            filterDataByParameter(event.target.value, paramToFilterByMin, Infinity);
        }
    }

    function handleMaxFilterChange(event){
        setParamToFilterByMax(event.target.value);
        if (paramToFilterBy) {
            if (paramToFilterByMin !== "") {
                filterDataByParameter(paramToFilterBy, paramToFilterByMin, event.target.value);
            } else {
                filterDataByParameter(paramToFilterBy, 0, event.target.value);
            }
        }
    }

    function handleMinFilterChange(event){
        setParamToFilterByMin(event.target.value);
        if (paramToFilterBy) {
            if (paramToFilterByMax !== "") {
                filterDataByParameter(paramToFilterBy, event.target.value, paramToFilterByMax);
            } else {
                filterDataByParameter(paramToFilterBy, event.target.value, Infinity);
            }
        }
    }

    function handleResetFilter(){
        setParamToFilterByMax("");
        setParamToFilterByMin("");
        setParamToFilterBy("");
        setDataToRender(defaultFilterData(data));
    }

    const columns = useMemo(() => [
        {Header: 'Country', accessor: 'country',},
        {Header: 'Cases', accessor: 'cases', 
            Cell: ({ value }) => (value !== null && value !== undefined && !isNaN(value) && isFinite(value) ? value : 'N/A')},
        {Header: 'Deaths', accessor: 'deaths', 
            Cell: ({ value }) => (value !== null && value !== undefined && !isNaN(value) && isFinite(value) ? value : 'N/A')},
        {Header: 'Cases total', accessor: 'totalCases', 
            Cell: ({ value }) => (value !== null && value !== undefined && !isNaN(value) && isFinite(value) ? value : 'N/A')},
        {Header: 'Deaths total', accessor: 'totalDeaths', 
            Cell: ({ value }) => (value !== null && value !== undefined && !isNaN(value) && isFinite(value) ? value : 'N/A')},
        {Header: 'Cases per 1000 people', accessor: 'casesPerPopulation', 
            Cell: ({ value }) => (value !== null && value !== undefined && !isNaN(value) && isFinite(value) ? value : 'N/A')},
        {Header: 'Deaths per 1000 people', accessor: 'deathsPerPopulation', 
            Cell: ({ value }) => (value !== null && value !== undefined && !isNaN(value) && isFinite(value) ? value : 'N/A')},
    ], []);

    const tableInstance = useTable({
        columns: columns,
        data: dataToRender,
        initialState: {pageSize: 20}
    }, useGlobalFilter, useSortBy, usePagination );
    
    const { 
            getTableProps, 
            getTableBodyProps, 
            headerGroups, 
            page, 
            nextPage,
            previousPage,
            canNextPage,
            canPreviousPage,
            pageOptions,
            gotoPage,
            pageCount,
            setPageSize,
            prepareRow,
            state,
            setGlobalFilter,
        } = tableInstance;

    const { pageIndex, globalFilter, pageSize} = state;

    function TabPanel(props){
        const { children, value, index, ...other} = props;

        return (
            <div
                role="tabpanel"
                hidden={value !== index}
                id={`tabpanel-${index}`}
                aria-labelledby={`tab-${index}`}
                {...other}
            >
                {value === index && (
                    <Box p={3}>
                        {children}
                    </Box>
                )}
            </div>
        );
    }
    const handleTabChange = (event, newTabValue) => setTabValue(newTabValue);
    
    return(<>{loading ? (<span>Loading...</span>) : (
            <div className="table-box">
                <div className="period-box"><span>Period from{<DatePicker className="datePicker" selected={startDate} onChange={handleStartDateChange }/>} 
                    to {<DatePicker className="datePicker" selected={endDate} onChange={handleEndDateChange}/>}</span></div><br/>
                
                <div>
                    <Tabs className="tab-panel" value={tabValue} onChange={handleTabChange}>
                        <Tab label="Table"/>
                        <Tab label="Graph"/>
                    </Tabs>

                    <TabPanel value={tabValue} index={0}>
                    <div className='table-container'>
                    <div className='filter-fields'>
                        <FilterByCountry filter={globalFilter} setFilter={setGlobalFilter} className="filter-field"/>
                        <select value={paramToFilterBy} onChange={handleFilterParameterChange} className="filter-field">
                            <option value="">Sort by field...</option>
                            <option value="cases">Cases</option>
                            <option value="deaths">Deaths</option>
                            <option value="totalCases">Cases total</option>
                            <option value="totalDeaths">Deaths total</option>
                            <option value="casesPerPopulation">Cases per 1000 people</option>
                            <option value="deathsPerPopulation">Deaths per 1000 people</option>
                        </select>
                        <input onChange={handleMinFilterChange} value={paramToFilterByMin} placeholder='value from' className="filter-field"></input>
                        <input onChange={handleMaxFilterChange} value={paramToFilterByMax} placeholder='value to' className="filter-field"></input>
                    </div>
                    <div className="resetBtn"><button onClick={handleResetFilter}>Reset filters</button></div>
                    <table {...getTableProps()} style={{ borderCollapse: 'collapse' }}>
                    <thead>
                        {headerGroups.map((headerGroup) => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map((column) => (
                                    <th {...column.getHeaderProps(column.getSortByToggleProps())} className="table-header">
                                        {column.render('Header')}
                                        <span>
                                            {column.isSorted ? (column.isSortedDesc ? '🔽' : '🔼') : ""}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody {...getTableBodyProps()}>
                        {page.map((row) => {
                            prepareRow(row);
                            return(
                                <tr {...row.getRowProps()}>
                                    {row.cells.map((cell) => (
                                        <td {...cell.getCellProps()} className="table-cell">{cell.render('Cell')}</td>
                                    ))}  
                                </tr>
                            );
                        })}   
                    </tbody>
                    </table> 
                    <div className="pagination-box">
                        <span className="page-count">
                            Page{' '}
                            <strong>
                                {pageIndex + 1} from {pageOptions.length}
                            </strong>{' '}
                        </span>
                        <button className="page-button" onClick={() => gotoPage(0)} disabled={!canPreviousPage}>◀◀</button>
                        <button className="page-button" onClick={() => previousPage()} disabled={!canPreviousPage}>◀</button>
                        <button className="page-button" onClick={() => nextPage()} disabled={!canNextPage}>▶</button>
                        <button className="page-button" onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>▶▶</button>
                    </div>
                </div>
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                        <div className="chart-container"><Chart data={dataForChart}/></div>
                    </TabPanel>
                </div> 
            </div>)}
            </>);
}
export default Table;