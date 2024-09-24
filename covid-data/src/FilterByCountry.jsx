
export const FilterByCountry = ({filter, setFilter}) => {
    return(
        <span>
            <input type='text' value={filter || ''} 
            placeholder='Search by country'
            onChange={e => setFilter(e.target.value)}/>
        </span>
    );
}
    