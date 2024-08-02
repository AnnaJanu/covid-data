
export const FilterByCountry = ({filter, setFilter}) => {
    return(
        <span>
            <input type='text' value={filter || ''} 
            placeholder='Поиск по стране'
            onChange={e => setFilter(e.target.value)}/>
        </span>
    );
}
    