<article @php post_class() @endphp>
  @php $term = get_the_category()[0]; @endphp
  <header>
    <a href="{{ get_term_link($term) }}" class="category mono">{!! $term->name !!}</span>
    <h2 class="entry-title"><a href="{{ get_permalink() }}">{!! get_the_title() !!}</a></h2>
    @include('partials/entry-meta')
  </header>
</article>
